import axiosClient from '../../../shared/services/axiosClient';
import type { DispatchSummary, PendingDispatch } from '../types';

/**
 * Único punto de acceso a la API para el módulo Tracking.
 * Es la única fuente que el Resumen Operativo consulta para el total real de
 * plántulas despachadas de una meta — Planning solo cierra el ciclo (libera el
 * lote), nunca crea el registro de despacho.
 */
export const trackingService = {
  getDispatchSummary: (productionGoalId: number) =>
    axiosClient.get<DispatchSummary>('/tracking/dispatch-summary', {
      params: { production_goal_id: productionGoalId },
    }),
  getPendingDispatches: (viveroId: number) =>
    axiosClient.get<PendingDispatch[]>('/tracking/pending-dispatches', {
      params: { vivero_id: viveroId },
    }),
  createDispatchReport: (lotCycleId: number, quantity: number, dispatchedAt?: string) =>
    axiosClient.post('/tracking/dispatch-reports', {
      lot_cycle_id: lotCycleId,
      quantity,
      dispatched_at: dispatchedAt,
    }),
};
