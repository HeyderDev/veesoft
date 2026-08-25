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

/** Shape cruda de un paginador de Laravel cuando NO pasa por paginatedResponse()
 * (por ejemplo, anidado dentro de successResponse en /tracking/lots/{lot}). */
export interface LaravelPaginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface TrackingClient {
  id: number;
  name: string;
  cedula: string;
  phone: string;
  created_at?: string;
}

export interface TrackingClientInput {
  name: string;
  cedula: string;
  phone: string;
}

export interface TrackingMovement {
  id: number;
  lot_id: number;
  tracking_client_id: number;
  quantity: number;
  movement_date: string;
  notes: string | null;
  tracking_client?: TrackingClient;
}

/** Fase actual del ciclo activo del lote (nombre/color para la etiqueta, fechas
 * para el panel de próximos despachos) — null si el lote no tiene ciclo en curso. */
export interface TrackingLotCurrentPhase {
  code: string;
  name: string;
  color_reference: string;
  planned_start_date: string;
  planned_end_date: string | null;
  gate_completed_at: string | null;
}

/** Lote administrado por Planning — Tracking solo lo lee, nunca lo crea/edita. */
export interface TrackingLot {
  id: number;
  code: string;
  name: string;
  total_capacity: number;
  current_status: 'available' | 'occupied' | 'inactive';
  vivero?: { id: number; name: string };
  current_phase?: TrackingLotCurrentPhase | null;
}

/** Saldo de capacidad del ciclo activo del lote — baja con cada salida registrada. */
export interface TrackingLotCapacity {
  total_capacity: number;
  dispatched: number;
  remaining: number;
}

export interface TrackingLotDetail {
  lot: TrackingLot;
  movements: LaravelPaginated<TrackingMovement>;
  capacity: TrackingLotCapacity;
}

export interface TrackingTopClient {
  tracking_client_id: number;
  name: string;
  total_quantity: number;
}

export interface TrackingGeneralSummary {
  total_lots: number;
  total_dispatched: number;
  top_clients: TrackingTopClient[];
}

/** Próximo despacho: lote cuya fase actual es DESP, con su fecha planeada. */
export interface UpcomingDispatch {
  lot_id: number;
  lot_name: string;
  lot_code: string;
  planned_date: string;
}

/** Panel informativo de la vista de tarjetas de Lotes. */
export interface TrackingProductionSummary {
  total_in_production: number;
  total_dispatched: number;
  upcoming_dispatches: UpcomingDispatch[];
}
