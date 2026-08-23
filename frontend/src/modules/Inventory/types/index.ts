export interface ToolUnit {
  id: number;
  tool_id: number;
  code: string;
  status: 'available' | 'borrowed' | 'maintenance' | 'out_of_service' | string;
  tool?: Tool;
}

export interface Tool {
  id: number;
  name: string;
  description: string | null;
  units?: ToolUnit[];
  units_count?: number;
  available_units_count?: number;
  borrowed_units_count?: number;
  out_of_service_units_count?: number;
  maintenance_units_count?: number;
  code?: string;
  status?: string;
  quantity?: number;
}

export interface Supply {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  unit: string;
  current_stock: number;
  total_stock: number;
  min_stock?: number;
}

export interface Movement {
  id: number;
  tool_id: number | null;
  tool_unit_id: number | null;
  supply_id: number | null;
  user_id: number | null;
  operational_task_id: number | null;
  type: string;
  quantity: number;
  previous_stock?: number | null;
  new_stock?: number | null;
  reason?: string | null;
  details: {
    usuario: string;
    detalles: string;
  } | null;
  observations: string | null;
  created_at: string;
  tool?: Tool;
  tool_unit?: ToolUnit;
  supply?: Supply;
}
