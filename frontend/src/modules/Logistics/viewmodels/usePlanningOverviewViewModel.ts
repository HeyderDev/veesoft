import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { planningService } from '../../Planning/services/planningService';
import type { MetaProduccion, Vivero, ViveroSummary } from '../../Planning/types';
import { tasksService } from '../../Tasks/services/tasksService';
import { inventoryService } from '../../Inventory/services/inventoryService';
import type { Supply } from '../../Inventory/types';

/**
 * Forma real de /tasks/history (con type=lot), tal como la devuelve el backend de Tasks
 * (ver OperationalTaskRepository::getHistory: with(['resources', 'lotCyclePhase.lotCycle.lot'])).
 * El tipo OperationalTask de Tasks no declara este anidado, así que se tipa aquí localmente
 * en vez de tocar el módulo de otro compañero.
 */
interface PlanningTaskRaw {
  id: number;
  title: string;
  status: 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low' | null;
  planned_date: string;
  resources?: { id: number; resource_type: 'tool' | 'supply'; resource_id: number }[];
  lot_cycle_phase?: {
    lot_cycle?: {
      lot?: { id: number; vivero_id: number; code: string; name: string };
    };
  } | null;
}

export interface ViveroOverview {
  vivero: Vivero;
  openGoal: MetaProduccion | null;
  lotStatusCounts: ViveroSummary['lot_status_counts'] | null;
  pendingTaskCount: number;
}

export interface SupplyResourceView {
  resourceId: number;
  supply: Supply | null;
  isCritical: boolean;
}

export interface PendingTaskOverview {
  id: number;
  title: string;
  planned_date: string;
  priority: 'high' | 'medium' | 'low' | null;
  viveroName: string | null;
  lotCode: string | null;
  supplyResources: SupplyResourceView[];
  toolResourceCount: number;
}

export interface AtRiskSupply {
  supply: Supply;
  taskTitles: string[];
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

export function usePlanningOverviewViewModel() {
  const [viveroOverviews, setViveroOverviews] = useState<ViveroOverview[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTaskOverview[]>([]);
  const [atRiskSupplies, setAtRiskSupplies] = useState<AtRiskSupply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [viverosRes, tasksRes, supplies] = await Promise.all([
        planningService.getViveros(),
        tasksService.getHistory({ status: 'pending', type: 'lot' }),
        inventoryService.getSupplies() as Promise<Supply[]>,
      ]);

      const viveros = viverosRes.data || [];
      const rawTasks = (tasksRes.data || []) as unknown as PlanningTaskRaw[];
      const suppliesById = new Map<number, Supply>(supplies.map((s): [number, Supply] => [s.id, s]));

      // ---- Planificación por vivero (reutiliza el mismo endpoint que Planning > Resumen) ----
      const summaries = await Promise.all(
        viveros.map(v => planningService.getViveroSummary(v.id).catch(() => null))
      );

      const taskCountByVivero = new Map<number, number>();
      for (const task of rawTasks) {
        const viveroId = task.lot_cycle_phase?.lot_cycle?.lot?.vivero_id;
        if (viveroId) taskCountByVivero.set(viveroId, (taskCountByVivero.get(viveroId) ?? 0) + 1);
      }

      setViveroOverviews(viveros.map((vivero, index) => {
        const summary = summaries[index]?.data;
        return {
          vivero,
          openGoal: summary?.open_goal ?? null,
          lotStatusCounts: summary?.lot_status_counts ?? null,
          pendingTaskCount: taskCountByVivero.get(vivero.id) ?? 0,
        };
      }));

      // ---- Actividades pendientes + insumos que traen asignados ----
      const riskMap = new Map<number, AtRiskSupply>();

      const tasksOverview: PendingTaskOverview[] = rawTasks.map(task => {
        const lot = task.lot_cycle_phase?.lot_cycle?.lot;
        const vivero = lot ? viveros.find(v => v.id === lot.vivero_id) : undefined;
        const resources = task.resources ?? [];

        const supplyResources: SupplyResourceView[] = resources
          .filter(r => r.resource_type === 'supply')
          .map(r => {
            const supply = suppliesById.get(r.resource_id) ?? null;
            // Laravel serializa decimal:2 como string ("2.00"), no number: hay que convertir
            // antes de comparar o se compararía lexicográficamente.
            const isCritical = !!supply && Number(supply.current_stock) <= Number(supply.min_stock);
            if (supply && isCritical) {
              const existing = riskMap.get(supply.id);
              if (existing) {
                existing.taskTitles.push(task.title);
              } else {
                riskMap.set(supply.id, { supply, taskTitles: [task.title] });
              }
            }
            return { resourceId: r.resource_id, supply, isCritical };
          });

        return {
          id: task.id,
          title: task.title,
          planned_date: task.planned_date,
          priority: task.priority,
          viveroName: vivero?.name ?? null,
          lotCode: lot?.code ?? null,
          supplyResources,
          toolResourceCount: resources.filter(r => r.resource_type === 'tool').length,
        };
      });

      setPendingTasks(tasksOverview);
      setAtRiskSupplies(Array.from(riskMap.values()));
    } catch (err) {
      error(extractErrorMessage(err, 'Error al cargar el panorama operativo'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return { viveroOverviews, pendingTasks, atRiskSupplies, isLoading, fetchAll };
}
