export type EstadoTarea = 'pending' | 'completed';
export type TaskTab = 'general' | 'lot' | 'templates' | 'history' | 'report';
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

export interface ActivityType {
  id: number;
  vivero_id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  system_code: string | null;
  default_priority: string;
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
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  
  resources?: TaskResource[];
  lot_id?: number | null;
  activity_type?: ActivityType;
}

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

export interface TaskHistoryFilters {
  lot_id?: number;
  status?: EstadoTarea;
  start_date?: string;
  end_date?: string;
}

export interface TaskHistoryResponse {
  data: OperationalTask[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface TaskReport {
  total: number;
  pending: number;
  completed: number;
  by_lot: {
    lot_id: number;
    lot_code: string;
    total: number;
    pending: number;
    completed: number;
  }[];
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


