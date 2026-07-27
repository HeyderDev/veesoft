export interface DispatchSummary {
  production_goal_id: number;
  dispatched_seedlings: number;
}

export type TrackingStage = 'germination' | 'nursery' | 'transplant' | 'ready_for_dispatch';

export interface TrackingMovement {
  id: number;
  tracking_item_id: number;
  type: 'entry' | 'exit';
  quantity: number;
  movement_date: string;
  notes: string | null;
  tracking_item?: { id: number; name: string };
}

export interface TrackingItem {
  id: number;
  name: string;
  species: string;
  stage: TrackingStage;
  quantity: number;
  unit: string;
  location: string;
  minimum_stock: number;
  notes: string | null;
  registered_at: string;
  movements?: TrackingMovement[];
}

export interface TrackingItemInput {
  name: string;
  species: string;
  stage: TrackingStage;
  quantity: number;
  unit: string;
  location: string;
  minimum_stock: number;
  notes: string;
}

export interface TrackingStageSummary {
  items_count: number;
  quantity: number;
}

export interface TrackingSummary {
  total_items: number;
  total_quantity: number;
  by_stage: Record<TrackingStage, TrackingStageSummary>;
}

/** Ciclo ya cerrado (lote liberado) a la espera de que se reporte cuánto se despachó. */
export interface PendingDispatch {
  id: number; // lot_cycle_id
  lot_id: number;
  production_goal_id: number;
  started_at: string;
  status: string;
  lot: {
    id: number;
    name: string;
    code: string;
    total_capacity: number;
  };
}
