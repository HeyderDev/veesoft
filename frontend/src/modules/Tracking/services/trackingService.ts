import axiosClient from '../../../shared/services/axiosClient';
import type {
  DispatchSummary, PendingDispatch, TrackingClient, TrackingClientInput,
  TrackingGeneralSummary, TrackingGoal, TrackingLot, TrackingLotDetail, TrackingMovement,
  TrackingProductionSummary,
} from '../types';

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

  // ---- Lotes (de Planning, solo lectura) ----
  getLots: (goalId?: number) =>
    axiosClient.get<TrackingLot[]>('/tracking/lots', { params: goalId ? { goal_id: goalId } : undefined }),
  getLotDetail: (lotId: number) => axiosClient.get<TrackingLotDetail>(`/tracking/lots/${lotId}`),
  getProductionSummary: (goalId?: number) =>
    axiosClient.get<TrackingProductionSummary>('/tracking/production-summary', { params: goalId ? { goal_id: goalId } : undefined }),
  getGoals: () => axiosClient.get<TrackingGoal[]>('/tracking/goals'),

  // ---- Movimientos de salida ----
  getMovements: (lotId?: number) =>
    axiosClient.get<TrackingMovement[]>('/tracking/movements', {
      params: lotId ? { lot_id: lotId } : undefined,
    }),
  createMovement: (data: {
    lot_id: number; tracking_client_id: number; quantity: number; notes?: string;
  }) => axiosClient.post('/tracking/movements', data),

  // ---- Clientes ----
  getClients: (search?: string) =>
    axiosClient.get<TrackingClient[]>('/tracking/clients', { params: search ? { search } : undefined }),
  createClient: (data: TrackingClientInput) => axiosClient.post('/tracking/clients', data),
  updateClient: (id: number, data: Partial<TrackingClientInput>) =>
    axiosClient.put(`/tracking/clients/${id}`, data),
  deleteClient: (id: number) => axiosClient.delete(`/tracking/clients/${id}`),

  // ---- Reportes ----
  getGeneralSummary: () => axiosClient.get<TrackingGeneralSummary>('/tracking/summary'),
  getLotSummary: (lotId: number) => axiosClient.get<TrackingLotDetail>(`/tracking/summary/lots/${lotId}`),
};
