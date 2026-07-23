export interface DispatchSummary {
  production_goal_id: number;
  dispatched_seedlings: number;
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
