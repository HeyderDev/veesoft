export interface Tool {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'DAMAGED';
  quantity: number;
}

export interface Supply {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
}

export interface Movement {
  id: number;
  tool_id: number | null;
  supply_id: number | null;
  user_id: number | null;
  type: string;
  quantity: number;
  details: {
    usuario: string;
    detalles: string;
  } | null;
  created_at: string;
  tool?: Tool;
  supply?: Supply;
}
