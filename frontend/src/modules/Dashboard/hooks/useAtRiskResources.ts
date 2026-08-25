import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { tasksService } from '../../Tasks/services/tasksService';
import { inventoryService } from '../../Inventory/services/inventoryService';
import type { Supply, Tool } from '../../Inventory/types';

/**
 * Forma real de /tasks (índice unificado, incluye actividades generales y por lote), tal
 * como la devuelve el backend de Tasks (ver OperationalTaskRepository::paginateWithRelations:
 * with(['resources', 'lotCyclePhase.lotCycle.lot'])).
 * El tipo OperationalTask de Tasks no declara este anidado, así que se tipa aquí localmente
 * en vez de tocar el módulo de otro compañero. `quantity` es un decimal de Laravel — llega
 * como string ("81.00"), no como number.
 */
interface PlanningTaskRaw {
  id: number;
  title: string;
  status: 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low' | null;
  planned_date: string;
  resources?: { id: number; resource_type: 'tool' | 'supply'; resource_id: number; quantity: string }[];
}

export interface AtRiskResource {
  resourceType: 'supply' | 'tool';
  resourceId: number;
  name: string;
  sku: string | null;
  unit: string;
  availableQuantity: number;
  totalRequestedQuantity: number;
  taskTitles: string[];
}

const priorityRank: Record<NonNullable<PlanningTaskRaw['priority']>, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

/**
 * Cruza TODAS las actividades pendientes del vivero (sin filtrar por meta —
 * el stock físico es del vivero, no de una meta) contra el stock disponible
 * de Inventario, reservando por prioridad (hoy primero, luego por
 * fecha/prioridad) para detectar qué recursos no van a alcanzar. Portado tal
 * cual desde el "Panorama" que tenía Logística (ahora retirado de ahí) —
 * mismo algoritmo, solo se descarta la parte de listar las tareas en sí
 * (eso lo cubre la sección de "Actividades del día/próximas" del Dashboard,
 * que sí está ligada a la meta seleccionada).
 */
export function useAtRiskResources() {
  const { activeVivero } = useActiveVivero();
  const [atRiskResources, setAtRiskResources] = useState<AtRiskResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const fetchAll = async () => {
    if (!activeVivero) {
      setAtRiskResources([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [tasksRes, supplies, tools] = await Promise.all([
        tasksService.getTasks({ status: 'pending' }, 1000),
        inventoryService.getSupplies() as Promise<Supply[]>,
        inventoryService.getTools() as Promise<Tool[]>,
      ]);

      const rawTasks = (tasksRes.data || []) as unknown as PlanningTaskRaw[];
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const scheduledTasks = rawTasks.filter(task => task.planned_date >= today);
      const suppliesById = new Map<number, Supply>(supplies.map((s): [number, Supply] => [s.id, s]));
      const toolsById = new Map<number, Tool>(tools.map((tool): [number, Tool] => [tool.id, tool]));

      const priorityOrderedTasks = [...scheduledTasks].sort((a, b) => {
        const aIsToday = a.planned_date === today;
        const bIsToday = b.planned_date === today;
        if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;
        const byDate = a.planned_date.localeCompare(b.planned_date);
        if (byDate !== 0) return byDate;
        return (a.priority ? priorityRank[a.priority] : 3) - (b.priority ? priorityRank[b.priority] : 3);
      });

      const availableByResource = new Map<string, number>();
      supplies.forEach(supply => availableByResource.set(`supply:${supply.id}`, Number(supply.current_stock)));
      tools.forEach(tool => availableByResource.set(`tool:${tool.id}`, Number(tool.available_units_count ?? 0)));
      const totalRequestedByResource = new Map<string, number>();
      const riskMap = new Map<string, AtRiskResource>();

      priorityOrderedTasks.forEach(task => {
        (task.resources ?? []).forEach(resource => {
          const key = `${resource.resource_type}:${resource.resource_id}`;
          const requestedQuantity = Number(resource.quantity);
          const availableQuantity = availableByResource.get(key) ?? 0;
          const totalRequestedQuantity = (totalRequestedByResource.get(key) ?? 0) + requestedQuantity;
          totalRequestedByResource.set(key, totalRequestedQuantity);
          availableByResource.set(key, Math.max(0, availableQuantity - requestedQuantity));

          if (availableQuantity < requestedQuantity) {
            const supply = resource.resource_type === 'supply' ? suppliesById.get(resource.resource_id) : null;
            const tool = resource.resource_type === 'tool' ? toolsById.get(resource.resource_id) : null;
            const existing = riskMap.get(key);
            if (existing) {
              existing.totalRequestedQuantity = totalRequestedQuantity;
              if (!existing.taskTitles.includes(task.title)) existing.taskTitles.push(task.title);
            } else {
              riskMap.set(key, {
                resourceType: resource.resource_type,
                resourceId: resource.resource_id,
                name: supply?.name ?? tool?.name ?? `${resource.resource_type === 'supply' ? 'Insumo' : 'Herramienta'} #${resource.resource_id}`,
                sku: supply?.sku ?? null,
                unit: supply?.unit ?? 'unidad',
                availableQuantity: resource.resource_type === 'supply'
                  ? Number(supply?.current_stock ?? 0)
                  : Number(tool?.available_units_count ?? 0),
                totalRequestedQuantity,
                taskTitles: [task.title],
              });
            }
          }
        });
      });

      setAtRiskResources(Array.from(riskMap.values()));
    } catch (err) {
      error(extractErrorMessage(err, 'Error al calcular los recursos en riesgo'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [activeVivero?.id]);

  return { atRiskResources, isLoading, refetch: fetchAll };
}
