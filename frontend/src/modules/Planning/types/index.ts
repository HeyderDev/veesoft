export interface Vivero {
  id: number;
  name: string;
  location: string;
  responsible: string;
  metas?: MetaProduccion[];
  lots?: Lote[];
  created_at?: string;
}

export type EstadoMeta = 'not_started' | 'active' | 'completed';

export interface MetaProduccion {
  id: number;
  vivero_id: number;
  title: string;
  description: string | null;
  target_seedlings: number;
  status: EstadoMeta;
  finished_at: string | null;
  created_at?: string;
  vivero?: Vivero;
  creator?: { first_name: string; last_name: string };
  /** Solo presente cuando el endpoint lo calcula (withSum en el backend). */
  produced_seedlings?: number;
}

/** Fila de GET /production-goals/history — una meta con sus números acumulados,
 * incluidas las ya culminadas (su historial no se borra, ver Historial). */
export interface MetaHistorialEntry {
  id: number;
  title: string;
  status: EstadoMeta;
  finished_at: string | null;
  created_at: string;
  target_seedlings: number;
  produced_seedlings: number;
  lot_cycles_count: number;
  distinct_lots_count: number;
  tasks_completed_count: number;
}

export type EstadoLote = 'available' | 'occupied' | 'inactive';

export interface LotCyclePhase {
  id: number;
  lot_cycle_id: number;
  phase_id: number;
  planned_start_date: string;
  /** Null para la fase de Despacho: no tiene fin planificado, termina al registrar el despacho. */
  planned_end_date: string | null;
  /**
   * Cuándo se completó la actividad obligatoria de esta fase (solo aplica a
   * fases gateadas, ver GATED_PHASE_CODES). Mientras sea null en una fase
   * gateada ya alcanzada, el backend la mantiene "actual" aunque haya vencido
   * su planned_end_date — ver LotCycleService::computeCurrentPhase().
   */
  gate_completed_at: string | null;
  phase?: Fase;
}

/**
 * Fases del ciclo que son, en la práctica, actividades obligatorias: Siembra,
 * Injertación y Despacho (ver backend GatedPhaseCatalog). No se pueden avanzar
 * sin su actividad completada, y su nombre/orden/duración no son editables.
 */
export const GATED_PHASE_CODES = ['SIEM', 'INJER', 'DESP'] as const;

export const isGatedPhaseCode = (code: string): boolean =>
  (GATED_PHASE_CODES as readonly string[]).includes(code);

export interface LotCycleInfo {
  id: number;
  lot_id: number;
  production_goal_id: number;
  started_at: string;
  status: 'in_progress' | 'dispatched';
  phases?: LotCyclePhase[];
  current_phase?: LotCyclePhase | null;
}

/** Fila del histórico "lotes por meta, y dentro de cada meta por ciclo" — GET /production-goals/{id}/lot-cycles. */
export interface LotCycleHistoryEntry extends LotCycleInfo {
  lot?: Pick<Lote, 'id' | 'code' | 'name'>;
}

/**
 * Nota de tipado: Laravel serializa los campos `decimal:N` como STRING en JSON
 * (para no perder precisión), no como number. width/length/funda_diameter/
 * corridor_width/position_x/position_y llegan así desde la API — conviértelos con
 * `Number(...)` antes de usarlos en cálculos o en <LotDiagram>.
 */
export interface Lote {
  id: number;
  vivero_id: number;
  code: string;
  name: string;
  funda_diameter: string; // cm, decimal serializado como string
  width: string; // m, decimal serializado como string
  length: string; // m, decimal serializado como string
  corridor_count: number;
  corridor_width: string; // cm, decimal serializado como string
  calculated_capacity: number;
  total_capacity: number;
  current_status: EstadoLote;
  position_x: string | null;
  position_y: string | null;
  notes: string | null;
  vivero?: Vivero;
  active_cycle?: LotCycleInfo | null;
}

/** Forma de los datos al CREAR un lote: aquí sí son number, no string (ver nota arriba). */
export interface LotCreateInput {
  vivero_id?: number;
  name: string;
  width: number;
  length: number;
  funda_diameter: number;
  corridor_count: number;
  corridor_width: number;
  notes: string;
}

export interface Fase {
  id: number;
  vivero_id: number;
  code: string;
  name: string;
  description: string;
  execution_order: number;
  estimated_duration_days: number;
  color_reference: string;
}

export interface PhaseDistribution {
  phase_id: number;
  code: string;
  name: string;
  color_reference: string;
  capacity: number;
}

export interface ProjectionVsReality {
  month: string; // 'YYYY-MM'
  projected: number;
  actual: number;
}

export interface ViveroSummary {
  vivero: Vivero;
  open_goal: MetaProduccion | null;
  lot_status_counts: { available: number; occupied: number; inactive: number };
  available_capacity: number;
  /** Capacidad de plántulas desde la fase Siembra en adelante (excluye Preparación). */
  production_capacity: number;
  phase_distribution: PhaseDistribution[];
  projection_vs_reality: ProjectionVsReality[];
  year: number;
}

