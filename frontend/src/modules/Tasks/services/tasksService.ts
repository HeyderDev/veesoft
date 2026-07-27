import axiosClient from '../../../shared/services/axiosClient';
import type { AvailableResources, LotInfo, OperationalTask, TaskCreateInput, TaskReport, TaskUpdateInput } from '../types';

/**
 * Único punto de acceso a la API para el módulo Tasks.
 * Ningún componente ni viewmodel debe llamar a axiosClient directamente.
 */
export const tasksService = {
  // ---- Tareas Operativas (generales) ----
  getTasks: (page = 1, perPage = 20) =>
    axiosClient.get<{ data: OperationalTask[]; meta: { current_page: number; last_page: number } }>('/tasks', { params: { page, per_page: perPage } }),

  getTask: (id: number) =>
    axiosClient.get<OperationalTask>(`/tasks/${id}`),

  createTask: (data: TaskCreateInput) =>
    axiosClient.post<OperationalTask>('/tasks', data),

  updateTask: (id: number, data: TaskUpdateInput) =>
    axiosClient.put<OperationalTask>(`/tasks/${id}`, data),

  completeTask: (id: number, completedBy: number) =>
    axiosClient.post<OperationalTask>(`/tasks/${id}/complete`, { completed_by: completedBy }),

  deleteTask: (id: number) =>
    axiosClient.delete(`/tasks/${id}`),

  // ---- Tareas por Lote ----
  getTasksByLot: (lotId: number) =>
    axiosClient.get<OperationalTask[]>(`/tasks/by-lot/${lotId}`),

  // ---- Historial ----
  getHistory: (filters?: { status?: string; type?: string }) =>
    axiosClient.get<OperationalTask[]>('/tasks/history', { params: filters }),

  // ---- Reporte ----
  getReport: () =>
    axiosClient.get<TaskReport>('/tasks/report'),

  // ---- Recursos de Inventario (herramientas e insumos disponibles) ----
  getAvailableResources: () =>
    axiosClient.get<AvailableResources>('/inventory/available-resources'),

  // ---- Lotes (de Planning) ----
  getLots: () =>
    axiosClient.get<LotInfo[]>('/lots'),
};
