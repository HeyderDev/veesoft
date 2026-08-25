import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { planningService } from '../../Planning/services/planningService';
import type { ViveroSummary } from '../../Planning/types';
import { tasksService } from '../../Tasks/services/tasksService';
import type { ActivitiesSummary, TaskGoal } from '../../Tasks/types';
import { trackingService } from '../../Tracking/services/trackingService';
import type { TrackingProductionSummary } from '../../Tracking/types';
import { inventoryService } from '../../Inventory/services/inventoryService';
import type { Supply, Tool } from '../../Inventory/types';
import { useAtRiskResources } from '../hooks/useAtRiskResources';

export interface DashboardTaskPreview {
  id: number;
  title: string;
  planned_date: string;
  isToday: boolean;
  priority: 'high' | 'medium' | 'low' | null;
  lotName: string | null;
}

/** Forma real de /tasks (ver mismo comentario en useAtRiskResources.ts). */
interface DashboardTaskRaw {
  id: number;
  title: string;
  status: 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low' | null;
  planned_date: string;
  lot_cycle_phase?: {
    lot_cycle?: {
      lot?: { name: string };
    };
  } | null;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

/**
 * Orquesta todas las fuentes del Dashboard general. Se separan explícitamente
 * los datos ligados a la meta seleccionada (se recargan cuando cambia
 * `selectedGoalId`) de los que reflejan el estado físico/estructural actual
 * del vivero (lotes, inventario, recursos en riesgo) y no dependen de la
 * meta elegida — misma regla que ya aplican Tareas y Seguimiento.
 */
export function useDashboardViewModel() {
  const { activeVivero } = useActiveVivero();
  const { error } = useToast();

  // ---- Selector de meta — mismo patrón que useTasksViewModel/useLotesViewModel ----
  const [goals, setGoals] = useState<TaskGoal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  useEffect(() => {
    tasksService.getGoals().then(res => {
      const data = res.data || [];
      setGoals(data);
      setSelectedGoalId(prev => prev ?? data.find(g => !g.finished_at)?.id ?? null);
    }).catch(err => console.error(err));
  }, []);

  const selectGoal = (goalId: number) => setSelectedGoalId(goalId);
  const openGoal = goals.find(g => !g.finished_at) ?? null;
  const selectedGoal = goals.find(g => g.id === selectedGoalId) ?? null;

  // ---- Ligado a meta: Meta Actual, Total de Actividades, Actividades del
  // día/próximas y Panorama de Seguimiento ----
  const [dispatchedSeedlings, setDispatchedSeedlings] = useState<number | undefined>(undefined);
  const [activitiesSummary, setActivitiesSummary] = useState<ActivitiesSummary | null>(null);
  const [tasksPreview, setTasksPreview] = useState<DashboardTaskPreview[]>([]);
  const [productionSummary, setProductionSummary] = useState<TrackingProductionSummary | null>(null);
  const [isLoadingGoalData, setIsLoadingGoalData] = useState(true);

  const fetchGoalScoped = useCallback(async () => {
    if (!selectedGoalId) {
      setDispatchedSeedlings(undefined);
      setActivitiesSummary(null);
      setTasksPreview([]);
      setProductionSummary(null);
      setIsLoadingGoalData(false);
      return;
    }

    setIsLoadingGoalData(true);
    try {
      const [dispatchRes, summaryRes, tasksRes, productionRes] = await Promise.all([
        trackingService.getDispatchSummary(selectedGoalId),
        tasksService.getSummary(selectedGoalId),
        tasksService.getTasks({ goal_id: selectedGoalId, status: 'pending' }, 1000),
        trackingService.getProductionSummary(selectedGoalId),
      ]);

      setDispatchedSeedlings(dispatchRes.data.dispatched_seedlings);
      setActivitiesSummary(summaryRes.data);
      setProductionSummary(productionRes.data);

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const rawTasks = (tasksRes.data || []) as unknown as DashboardTaskRaw[];

      const preview = rawTasks
        .map(task => ({
          id: task.id,
          title: task.title,
          planned_date: task.planned_date,
          isToday: task.planned_date === today,
          priority: task.priority,
          lotName: task.lot_cycle_phase?.lot_cycle?.lot?.name ?? null,
        }))
        .sort((a, b) => {
          if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
          return a.planned_date.localeCompare(b.planned_date);
        })
        .slice(0, 6);

      setTasksPreview(preview);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al cargar los datos de la meta'));
      console.error(err);
    } finally {
      setIsLoadingGoalData(false);
    }
  }, [selectedGoalId, error]);

  useEffect(() => { fetchGoalScoped(); }, [fetchGoalScoped]);

  // ---- No ligado a meta: producción en curso + lotes (estado físico actual) ----
  const [viveroSummary, setViveroSummary] = useState<ViveroSummary | null>(null);
  const [isLoadingVivero, setIsLoadingVivero] = useState(true);

  useEffect(() => {
    if (!activeVivero) return;
    setIsLoadingVivero(true);
    planningService.getViveroSummary(activeVivero.id)
      .then(res => setViveroSummary(res.data))
      .catch(err => {
        error(extractErrorMessage(err, 'Error al cargar el panorama de producción'));
        console.error(err);
      })
      .finally(() => setIsLoadingVivero(false));
  }, [activeVivero?.id, error]);

  // ---- No ligado a meta: totales de Inventario ----
  const [totalTools, setTotalTools] = useState<number | null>(null);
  const [totalSupplies, setTotalSupplies] = useState<number | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

  useEffect(() => {
    if (!activeVivero) return;
    setIsLoadingInventory(true);
    Promise.all([
      inventoryService.getTools() as Promise<Tool[]>,
      inventoryService.getSupplies() as Promise<Supply[]>,
    ])
      .then(([tools, supplies]) => {
        setTotalTools(tools.reduce((acc, t) => acc + (t.units_count || 0), 0));
        setTotalSupplies(supplies.length);
      })
      .catch(err => {
        error(extractErrorMessage(err, 'Error al cargar el inventario'));
        console.error(err);
      })
      .finally(() => setIsLoadingInventory(false));
  }, [activeVivero?.id, error]);

  // ---- No ligado a meta: recursos en riesgo (movido desde Logística) ----
  const { atRiskResources, isLoading: isLoadingAtRisk } = useAtRiskResources();

  return {
    activeVivero,
    goals, selectedGoalId, selectGoal, openGoal, selectedGoal,
    dispatchedSeedlings, activitiesSummary, tasksPreview, productionSummary, isLoadingGoalData,
    viveroSummary, isLoadingVivero,
    totalTools, totalSupplies, isLoadingInventory,
    atRiskResources, isLoadingAtRisk,
  };
}
