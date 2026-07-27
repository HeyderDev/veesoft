import axiosClient from '../../../shared/services/axiosClient';
import type {
  DispatchSummary, PendingDispatch, TrackingItem, TrackingItemInput,
  TrackingMovement, TrackingSummary,
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

  // ---- Seguimiento de inventario (TrackingItem / TrackingMovement) ----
  getTrackingItems: (params?: { search?: string; stage?: string }) =>
    axiosClient.get<TrackingItem[]>('/tracking/items', { params }),
  getTrackingItem: (id: number) => axiosClient.get<TrackingItem>(`/tracking/items/${id}`),
  createTrackingItem: (data: TrackingItemInput) => axiosClient.post('/tracking/items', data),
  updateTrackingItem: (id: number, data: Partial<TrackingItemInput>) =>
    axiosClient.put(`/tracking/items/${id}`, data),
  deleteTrackingItem: (id: number) => axiosClient.delete(`/tracking/items/${id}`),

  getTrackingMovements: (trackingItemId?: number) =>
    axiosClient.get<TrackingMovement[]>('/tracking/movements', {
      params: trackingItemId ? { tracking_item_id: trackingItemId } : undefined,
    }),
  createTrackingMovement: (data: {
    tracking_item_id: number; type: 'entry' | 'exit'; quantity: number; notes?: string;
  }) => axiosClient.post('/tracking/movements', data),

  getTrackingSummary: () => axiosClient.get<TrackingSummary>('/tracking/summary'),
  getStockAlerts: () => axiosClient.get<TrackingItem[]>('/tracking/summary/alerts'),
};
