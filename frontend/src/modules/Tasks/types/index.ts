export type EstadoTarea = 'pending' | 'completed';
export type TaskTab = 'activities' | 'templates' | 'reportes';
export type PrioridadTarea = 'high' | 'medium' | 'low';

export interface TaskResource {
  id: number;
  operational_task_id: number;
  resource_type: 'tool' | 'supply';
  resource_id: number;
  quantity?: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityTypeResource {
  id: number;
  activity_type_id: number;
  resource_type: 'tool' | 'supply';
  resource_id: number;
  quantity: number;
}

export interface ActivityType {
  id: number;
  vivero_id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  system_code: string | null;
  default_priority: string;
  resources?: ActivityTypeResource[];
}

export interface OperationalTask {
  id: number;
  title: string;
  description: string | null;
  observations: string | null;
  status: EstadoTarea;
  priority: PrioridadTarea | null;
  planned_date: string;
  completed_date: string | null;
  completed_by: number | null;
  lot_cycle_phase_id: number | null;
  activity_type_id: number | null;
  production_goal_id: number | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;

  resources?: TaskResource[];
  lot_id?: number | null;
  activity_type?: ActivityType;
}

// Payload mínimo del flujo "Desde Plantilla": el backend copia el resto
// (title/description/priority/resources) desde la plantilla.
export interface TaskTemplateCreateInput {
  activity_type_id: number;
  planned_date: string;
  lot_id?: number | null;
  assigned_to?: number | null;
}

// Flujo "Libre": formulario completo, sin plantilla.
export interface TaskCreateInput {
  activity_type_id?: number | null;
  title: string;
  description?: string;
  observations?: string;
  priority?: PrioridadTarea | null;
  planned_date: string;
  lot_id?: number | null;
  assigned_to?: number | null;
  resources?: { type: 'tool' | 'supply'; id: number; quantity?: number }[];
}

export interface TaskUpdateInput {
  activity_type_id?: number | null;
  title?: string;
  description?: string;
  observations?: string;
  priority?: PrioridadTarea | null;
  planned_date?: string;
  lot_id?: number | null;
  assigned_to?: number | null;
  status?: EstadoTarea;
  resources?: { type: 'tool' | 'supply'; id: number; quantity?: number }[];
}

export interface AvailableResource {
  id: number;
  type: 'tool' | 'supply';
  code: string;
  name: string;
  unit?: string;
  description: string | null;
}

// --- Búsqueda unificada de Actividades ---
export interface TaskListFilters {
  search?: string;
  status?: EstadoTarea;
  scope?: 'general' | `lot:${number}`;
  page?: number;
  goal_id?: number;
}

// --- Cards de la sección Actividades ---
export interface ActivitiesSummaryEntry {
  completed: number;
  total: number;
}

export interface ActivitiesSummaryByLot extends ActivitiesSummaryEntry {
  lot_id: number;
  lot_code: string;
  lot_name: string;
}

export interface ActivitiesSummary {
  general: ActivitiesSummaryEntry;
  by_lot: ActivitiesSummaryByLot[];
  overall: ActivitiesSummaryEntry;
  /** La meta realmente abierta del vivero, siempre — aunque se esté viendo una
   * meta pasada (goal_id explícito). Null si el vivero no tiene meta abierta. */
  open_goal: { id: number; title: string } | null;
}

// --- Selector de meta en Actividades ---
export interface TaskGoal {
  id: number;
  title: string;
  status: 'not_started' | 'active' | 'completed';
  finished_at: string | null;
  target_seedlings: number;
  produced_seedlings: number;
}

// --- Calendario mensual ---
export interface CalendarDayCount {
  date: string;
  count: number;
}

// --- Sección Reportes (Año/Mes/Día) ---
export interface ReportQueryFilters {
  year: number;
  month?: number;
  day?: number;
}

export interface ReportQueryResult {
  total: number;
  completed: number;
  pending: number;
  tasks: OperationalTask[];
}

// --- Doble confirmación al completar la actividad de Despacho ---
export interface DispatchPreview {
  lot_name: string;
  quantity: number;
}

// --- Inventory items (from Inventory module) ---
export interface InventoryTool {
  id: number;
  code: string;
  name: string;
  description: string | null;
  quantity: number;
}

export interface InventorySupply {
  id: number;
  sku: string;
  name: string;
  unit: string;
  current_stock: number;
}

export interface AvailableResources {
  tools: InventoryTool[];
  supplies: InventorySupply[];
}

// --- Lot info (from Planning module) ---
export interface LotInfo {
  id: number;
  code: string;
  name: string;
  current_status: string;
}
