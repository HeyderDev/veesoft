import axiosClient from '../../../shared/services/axiosClient';
import type {
  Fase, Lote, LotCreateInput, LotCycleInfo, MetaProduccion, Vivero, ViveroSummary,
} from '../types';

/**
 * Único punto de acceso a la API para el módulo Planning.
 * Ningún componente ni viewmodel debe llamar a axiosClient directamente.
 */
export const planningService = {
  // ---- Viveros ----
  getViveros: () => axiosClient.get<Vivero[]>('/viveros'),
  createVivero: (data: Partial<Vivero>) => axiosClient.post('/viveros', data),
  updateVivero: (id: number, data: Partial<Vivero>) => axiosClient.put(`/viveros/${id}`, data),
  deleteVivero: (id: number) => axiosClient.delete(`/viveros/${id}`),

  // ---- Metas ----
  getGoals: () => axiosClient.get<MetaProduccion[]>('/production-goals'),
  createGoal: (data: Partial<MetaProduccion>) => axiosClient.post('/production-goals', data),
  updateGoal: (id: number, data: Partial<MetaProduccion>) => axiosClient.put(`/production-goals/${id}`, data),
  deleteGoal: (id: number) => axiosClient.delete(`/production-goals/${id}`),
  culminarGoal: (id: number) => axiosClient.post(`/production-goals/${id}/culminar`),

  // ---- Lotes ----
  getLots: () => axiosClient.get<Lote[]>('/lots'),
  createLot: (data: LotCreateInput) => axiosClient.post('/lots', data),
  updateLot: (id: number, data: Partial<Pick<Lote, 'name' | 'notes'>>) => axiosClient.put(`/lots/${id}`, data),
  deleteLot: (id: number) => axiosClient.delete(`/lots/${id}`),
  updateLotCapacity: (id: number, totalCapacity: number) =>
    axiosClient.patch(`/lots/${id}/capacity`, { total_capacity: totalCapacity }),
  updateLotStatus: (id: number, status: Exclude<Lote['current_status'], 'occupied'>) =>
    axiosClient.patch(`/lots/${id}/status`, { current_status: status }),
  updateLotPosition: (id: number, positionX: number, positionY: number) =>
    axiosClient.patch(`/lots/${id}/position`, { position_x: positionX, position_y: positionY }),

  // ---- Fases (catálogo global — única configuración, no hay personalización por lote) ----
  getPhases: () => axiosClient.get<Fase[]>('/production-phases'),
  updatePhase: (id: number, data: Partial<Fase>) => axiosClient.put(`/production-phases/${id}`, data),

  // ---- Ciclo productivo del lote ----
  startLotCycle: (lotId: number, startedAt: string, startingPhaseId?: number) =>
    axiosClient.post<LotCycleInfo>(`/lots/${lotId}/cycles`, {
      started_at: startedAt,
      starting_phase_id: startingPhaseId,
    }),
  terminateDispatch: (lotId: number) =>
    axiosClient.post<Lote>(`/lots/${lotId}/cycles/current/terminate-dispatch`),
  rescheduleLotCycle: (lotId: number, transitionDate: string) =>
    axiosClient.post<LotCycleInfo>(`/lots/${lotId}/cycles/current/reschedule`, { transition_date: transitionDate }),

  // ---- Resumen ----
  getViveroSummary: (viveroId: number, year?: number) =>
    axiosClient.get<ViveroSummary>(`/viveros/${viveroId}/summary`, { params: year ? { year } : undefined }),
};
