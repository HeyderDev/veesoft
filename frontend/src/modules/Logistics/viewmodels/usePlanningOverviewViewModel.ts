import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { planningService } from '../../Planning/services/planningService';
import type { MetaProduccion, ViveroSummary } from '../../Planning/types';
import { tasksService } from '../../Tasks/services/tasksService';
import { inventoryService } from '../../Inventory/services/inventoryService';
import type { Supply, Tool } from '../../Inventory/types';

/**
 * Forma real de /tasks (índice unificado, incluye actividades generales y por lote), tal
 * como la devuelve el backend de Tasks (ver OperationalTaskRepository::paginateWithRelations:
 * with(['resources', 'lotCyclePhase.lotCycle.lot'])).
 * El tipo OperationalTask de Tasks no declara este anidado, así que se tipa aquí localmente
 * en vez de tocar el módulo de otro compañero. `quantity` es un decimal de Laravel — llega
 * como string ("81.00"), no como number (misma nota que en el resto del módulo).
 */
interface PlanningTaskRaw {
  id: number;
  title: string;
  status: 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low' | null;
  planned_date: string;
  resources?: { id: number; resource_type: 'tool' | 'supply'; resource_id: number; quantity: string }[];
  lot_cycle_phase?: {
    lot_cycle?: {
      lot?: { id: number; vivero_id: number; code: string; name: string };
    };
  } | null;
}

export interface ViveroOverview {
  openGoal: MetaProduccion | null;
  lotStatusCounts: ViveroSummary['lot_status_counts'] | null;
  pendingTaskCount: number;
}

export interface SupplyResourceView {
  resourceId: number;
  supply: Supply | null;
  requestedQuantity: number;
  isCritical: boolean;
}

export interface ToolResourceView {
  resourceId: number;
  tool: Tool | null;
  requestedQuantity: number;
  isCritical: boolean;
}

export interface PendingTaskOverview {
  id: number;
  title: string;
  planned_date: string;
  isToday: boolean;
  priority: 'high' | 'medium' | 'low' | null;
  viveroName: string | null;
  lotCode: string | null;
  isGeneral: boolean;
  supplyResources: SupplyResourceView[];
  toolResources: ToolResourceView[];
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

export function usePlanningOverviewViewModel() {
  const { activeVivero } = useActiveVivero();
  const [viveroOverview, setViveroOverview] = useState<ViveroOverview | null>(null);
  const [pendingTasks, setPendingTasks] = useState<PendingTaskOverview[]>([]);
  const [atRiskResources, setAtRiskResources] = useState<AtRiskResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const fetchAll = async () => {
    if (!activeVivero) {
      setViveroOverview(null);
      setPendingTasks([]);
      setAtRiskResources([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Todo lo que sigue queda filtrado al vivero activo: tasksService/inventoryService
      // van con el header X-Vivero-Id (axiosClient), y el resumen se pide puntual para
      // ese vivero — nunca se listan los demás viveros del sistema (ver ActiveViveroContext).
      const [summaryRes, tasksRes, supplies, tools] = await Promise.all([
        planningService.getViveroSummary(activeVivero.id).catch(() => null),
        // Sin `scope` para incluir las actividades generales del vivero y las de cada lote;
        // per_page alto porque esto es una lectura interna para el panorama de riesgo de
        // recursos, no una lista paginada de cara al usuario.
        tasksService.getTasks({ status: 'pending' }, 1000),
        inventoryService.getSupplies() as Promise<Supply[]>,
        inventoryService.getTools() as Promise<Tool[]>,
      ]);

      const rawTasks = (tasksRes.data?.data || []) as unknown as PlanningTaskRaw[];
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      // El panorama operativo es prospectivo: no mezcla tareas atrasadas con la
      // planificación de hoy y de los próximos días.
      const scheduledTasks = rawTasks.filter(task => task.planned_date >= today);
      const suppliesById = new Map<number, Supply>(supplies.map((s): [number, Supply] => [s.id, s]));
      const toolsById = new Map<number, Tool>(tools.map((tool): [number, Tool] => [tool.id, tool]));

      setViveroOverview({
        openGoal: summaryRes?.data.open_goal ?? null,
        lotStatusCounts: summaryRes?.data.lot_status_counts ?? null,
        pendingTaskCount: scheduledTasks.length,
      });

      // Se reserva primero el recurso para las actividades de hoy y luego para las futuras.
      // Así una actividad posterior queda marcada si el saldo ya fue comprometido por otra
      // más prioritaria, en lugar de comparar cada una contra el stock original aislado.
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

      const tasksOverview: PendingTaskOverview[] = priorityOrderedTasks.map(task => {
        const lot = task.lot_cycle_phase?.lot_cycle?.lot;
        const resources = task.resources ?? [];

        const assessResource = (resource: NonNullable<PlanningTaskRaw['resources']>[number]) => {
          const key = `${resource.resource_type}:${resource.resource_id}`;
          const requestedQuantity = Number(resource.quantity);
          const availableQuantity = availableByResource.get(key) ?? 0;
          const totalRequestedQuantity = (totalRequestedByResource.get(key) ?? 0) + requestedQuantity;
          totalRequestedByResource.set(key, totalRequestedQuantity);
          availableByResource.set(key, Math.max(0, availableQuantity - requestedQuantity));
          const isCritical = availableQuantity < requestedQuantity;

          if (isCritical) {
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

          return { requestedQuantity, isCritical };
        };

        const supplyResources: SupplyResourceView[] = resources
          .filter(r => r.resource_type === 'supply')
          .map(r => ({ resourceId: r.resource_id, supply: suppliesById.get(r.resource_id) ?? null, ...assessResource(r) }));
        const toolResources: ToolResourceView[] = resources
          .filter(r => r.resource_type === 'tool')
          .map(r => ({ resourceId: r.resource_id, tool: toolsById.get(r.resource_id) ?? null, ...assessResource(r) }));

        return {
          id: task.id,
          title: task.title,
          planned_date: task.planned_date,
          isToday: task.planned_date === today,
          priority: task.priority,
          viveroName: activeVivero.name,
          lotCode: lot?.code ?? null,
          isGeneral: !lot,
          supplyResources,
          toolResources,
        };
      });

      setPendingTasks(tasksOverview.sort((a, b) => {
        if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
        const byDate = a.planned_date.localeCompare(b.planned_date);
        if (byDate !== 0) return byDate;
        return (a.priority ? priorityRank[a.priority] : 3) - (b.priority ? priorityRank[b.priority] : 3);
      }));
      setAtRiskResources(Array.from(riskMap.values()));
    } catch (err) {
      error(extractErrorMessage(err, 'Error al cargar el panorama operativo'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [activeVivero?.id]);

  return { activeVivero, viveroOverview, pendingTasks, atRiskResources, isLoading, fetchAll };
}
