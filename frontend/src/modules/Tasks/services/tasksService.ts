import axiosClient from '../../../shared/services/axiosClient';
import type {
  ActivitiesSummary,
  ActivityType,
  AvailableResources,
  CalendarDayCount,
  DispatchPreview,
  LotInfo,
  OperationalTask,
  ReportQueryFilters,
  ReportQueryResult,
  TaskCreateInput,
  TaskGoal,
  TaskListFilters,
  TaskTemplateCreateInput,
  TaskUpdateInput,
} from '../types';

/**
 * Único punto de acceso a la API para el módulo Tasks.
 * Ningún componente ni viewmodel debe llamar a axiosClient directamente.
 */
export const tasksService = {
  // ---- Actividades (búsqueda unificada: generales + por lote) ----
  getTasks: (filters: TaskListFilters = {}, perPage = 20) =>
    axiosClient.get<{ data: OperationalTask[]; meta: { current_page: number; last_page: number } }>('/tasks', {
      params: { ...filters, per_page: perPage },
    }),

  getTask: (id: number) =>
    axiosClient.get<OperationalTask>(`/tasks/${id}`),

  createTask: (data: TaskCreateInput | TaskTemplateCreateInput) =>
    axiosClient.post<OperationalTask>('/tasks', data),

  updateTask: (id: number, data: TaskUpdateInput) =>
    axiosClient.put<OperationalTask>(`/tasks/${id}`, data),

  completeTask: (id: number, completedBy: number) =>
    axiosClient.post<OperationalTask>(`/tasks/${id}/complete`, { completed_by: completedBy }),

  // ---- Doble confirmación al completar la actividad de Despacho: la cantidad
  // sale de los movimientos de salida ya registrados en Seguimiento, nunca se
  // escribe a mano acá. ----
  getDispatchPreview: (id: number) =>
    axiosClient.get<DispatchPreview>(`/tasks/${id}/dispatch-preview`),

  deleteTask: (id: number) =>
    axiosClient.delete(`/tasks/${id}`),

  // ---- Cards de la sección Actividades (meta abierta, o una específica) ----
  getSummary: (goalId?: number) =>
    axiosClient.get<ActivitiesSummary>('/tasks/summary', { params: goalId ? { goal_id: goalId } : undefined }),

  // ---- Calendario mensual ----
  getCalendar: (year: number, month: number, goalId?: number) =>
    axiosClient.get<CalendarDayCount[]>('/tasks/calendar', { params: { year, month, goal_id: goalId } }),

  // ---- Selector de meta ----
  getGoals: () =>
    axiosClient.get<TaskGoal[]>('/tasks/goals'),

  // ---- Reportes (Año/Mes/Día, histórico, sin scope de meta) ----
  getReportQuery: (filters: ReportQueryFilters) =>
    axiosClient.get<ReportQueryResult>('/tasks/report-query', { params: filters }),

  // ---- Recursos de Inventario (herramientas e insumos disponibles) ----
  getAvailableResources: () =>
    axiosClient.get<AvailableResources>('/inventory/available-resources'),

  // ---- Lotes (de Planning) ----
  getLots: () =>
    axiosClient.get<LotInfo[]>('/lots'),

  // ---- Activity Types (Plantillas) ----
  getActivityTypes: () =>
    axiosClient.get<ActivityType[]>('/activity-types'),

  createActivityType: (data: { name: string; description?: string; default_priority?: string; resources?: { type: 'tool' | 'supply'; id: number; quantity?: number }[] }) =>
    axiosClient.post<ActivityType>('/activity-types', data),

  updateActivityType: (id: number, data: { name?: string; description?: string; default_priority?: string; resources?: { type: 'tool' | 'supply'; id: number; quantity?: number }[] }) =>
    axiosClient.put<ActivityType>(`/activity-types/${id}`, data),

  deleteActivityType: (id: number) =>
    axiosClient.delete(`/activity-types/${id}`),
};
