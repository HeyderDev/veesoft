import React, { useMemo, useState } from 'react';
import type { Lote } from '../types';
import { isGatedPhaseCode } from '../types';
import {
  addDays, addMonths, diffDays, formatDDMM, isoWeekNumber, monthLabel, monthLabelLong,
  parseDate, sameDate, startOfMonth, startOfWeekMonday, todayUTC, weekdayLabel,
} from '../utils/ganttDate';

type CalendarMode = 'day' | 'week' | 'month' | 'year';

const GUTTER_WIDTH = 160;
const ROW_HEIGHT = 32;

interface SubCell {
  label: string;
  leftPct: number;
  widthPct: number;
  isToday: boolean;
}

interface TopColumn {
  key: string;
  label: string;
  leftPct: number;
  widthPct: number;
  subcells?: SubCell[];
}

interface Window {
  start: Date;
  end: Date; // exclusivo
  totalDays: number;
  columns: TopColumn[];
}

function buildWindow(mode: CalendarMode, today: Date, selectedYear: number): Window {
  if (mode === 'day') {
    const start = addDays(today, -2);
    const end = addDays(today, 3);
    const totalDays = diffDays(start, end);
    const columns: TopColumn[] = Array.from({ length: 5 }, (_, i) => {
      const colStart = addDays(start, i);
      return {
        key: String(i),
        label: `${weekdayLabel(colStart)} ${formatDDMM(colStart)}`,
        leftPct: (i / totalDays) * 100,
        widthPct: (1 / totalDays) * 100,
      };
    });
    return { start, end, totalDays, columns };
  }

  if (mode === 'week') {
    const currentMonday = startOfWeekMonday(today);
    const start = addDays(currentMonday, -14);
    const end = addDays(currentMonday, 21);
    const totalDays = diffDays(start, end);
    const columns: TopColumn[] = Array.from({ length: 5 }, (_, w) => {
      const weekStart = addDays(start, w * 7);
      const subcells: SubCell[] = Array.from({ length: 7 }, (_, d) => {
        const dayDate = addDays(weekStart, d);
        return {
          label: formatDDMM(dayDate),
          leftPct: (((w * 7 + d) / totalDays) * 100),
          widthPct: (1 / totalDays) * 100,
          isToday: sameDate(dayDate, today),
        };
      });
      return {
        key: String(w),
        label: `SEMANA ${isoWeekNumber(weekStart)}`,
        leftPct: ((w * 7) / totalDays) * 100,
        widthPct: (7 / totalDays) * 100,
        subcells,
      };
    });
    return { start, end, totalDays, columns };
  }

  if (mode === 'month') {
    const currentMonthStart = startOfMonth(today);
    const start = addMonths(currentMonthStart, -2);
    const end = addMonths(currentMonthStart, 3);
    const totalDays = diffDays(start, end);
    const columns: TopColumn[] = [];
    let cursor = start;
    for (let m = 0; m < 5; m++) {
      const monthStart = cursor;
      const monthEnd = addMonths(monthStart, 1);
      const days = diffDays(monthStart, monthEnd);
      columns.push({
        key: String(m),
        label: monthLabelLong(monthStart),
        leftPct: (diffDays(start, monthStart) / totalDays) * 100,
        widthPct: (days / totalDays) * 100,
      });
      cursor = monthEnd;
    }
    return { start, end, totalDays, columns };
  }

  // year
  const start = new Date(Date.UTC(selectedYear, 0, 1));
  const end = new Date(Date.UTC(selectedYear + 1, 0, 1));
  const totalDays = diffDays(start, end);
  const columns: TopColumn[] = [];
  let cursor = start;
  for (let m = 0; m < 12; m++) {
    const monthStart = cursor;
    const monthEnd = addMonths(monthStart, 1);
    const days = diffDays(monthStart, monthEnd);
    columns.push({
      key: String(m),
      label: monthLabel(monthStart),
      leftPct: (diffDays(start, monthStart) / totalDays) * 100,
      widthPct: (days / totalDays) * 100,
    });
    cursor = monthEnd;
  }
  return { start, end, totalDays, columns };
}

interface LotCalendarViewProps {
  lots: Lote[];
  onReschedule: (lote: Lote) => void;
}

export const LotCalendarView: React.FC<LotCalendarViewProps> = ({ lots, onReschedule }) => {
  const [mode, setMode] = useState<CalendarMode>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  // Columna resaltada al pasar el mouse — misma mecánica en los 4 filtros (día/
  // semana/mes/año) porque todos comparten el mismo modelo win.columns.
  const [hoveredColKey, setHoveredColKey] = useState<string | null>(null);

  const activeLots = useMemo(
    () => lots.filter(l => l.active_cycle && (l.active_cycle.phases?.length ?? 0) > 0),
    [lots],
  );

  const today = todayUTC();
  const win = useMemo(() => buildWindow(mode, today, selectedYear), [mode, today, selectedYear]);

  const legend = useMemo(() => {
    const map = new Map<number, { name: string; color: string }>();
    activeLots.forEach(lot => {
      lot.active_cycle!.phases!.forEach(p => {
        if (p.phase && !map.has(p.phase_id)) {
          map.set(p.phase_id, { name: p.phase.name, color: p.phase.color_reference });
        }
      });
    });
    return Array.from(map.values());
  }, [activeLots]);

  const toPct = (date: Date) => (diffDays(win.start, date) / win.totalDays) * 100;

  const todayInWindow = today >= win.start && today < win.end;
  const todayOffsetPct = todayInWindow ? toPct(today) : null;
  const bodyHeight = Math.max(activeLots.length, 1) * ROW_HEIGHT;

  // Un solo handler para encabezado y cuerpo: mousemove burbujea desde cualquier
  // hijo (incluida una barra de fase encima), así el hover de columna funciona
  // sin importar qué haya debajo del cursor, en los 4 filtros por igual.
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const col = win.columns.find(c => pct >= c.leftPct && pct < c.leftPct + c.widthPct);
    setHoveredColKey(col ? col.key : null);
  };
  const handleTimelineMouseLeave = () => setHoveredColKey(null);

  const modeOptions: { id: CalendarMode; label: string }[] = [
    { id: 'day', label: 'Día' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'year', label: 'Año' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-[90%] mx-auto">
      <div className="mb-5">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Calendario de Fases</h3>
          <p className="text-xs text-slate-500 mt-1">Cronograma de todos los lotes con ciclo activo en este vivero</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          {mode === 'year' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedYear(y => y - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-slate-700 w-14 text-center">{selectedYear}</span>
              <button
                type="button"
                onClick={() => setSelectedYear(y => y + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                ›
              </button>
            </div>
          )}
          <div className="flex bg-slate-100 rounded-lg p-1">
            {modeOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === opt.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-3 mb-4">
        {legend.map(item => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            {item.name}
          </div>
        ))}
      </div>

      {activeLots.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-400">Ningún lote de este vivero tiene un ciclo en curso todavía.</p>
        </div>
      ) : (
        <div className="overflow-x-auto lg:overflow-visible -mx-1 px-1">
          <div className="min-w-[640px] lg:min-w-0">
          {/* Encabezado */}
            <div className="flex">
              <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
              <div
                className="relative flex-1 border-b border-slate-200"
                style={{ height: mode === 'week' ? 40 : 24 }}
                onMouseMove={handleTimelineMouseMove}
                onMouseLeave={handleTimelineMouseLeave}
              >
                {win.columns.map(col => (
                  <div
                    key={col.key}
                    className={`absolute top-0 h-6 flex items-center justify-center text-[11px] font-semibold border-l border-slate-100 truncate px-1 cursor-default transition-colors ${
                      hoveredColKey === col.key ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'
                    }`}
                    style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}
                  >
                    {col.label}
                  </div>
                ))}
                {mode === 'week' && win.columns.map(col => (
                  <div key={`${col.key}-sub`} className="absolute top-6 h-4" style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}>
                    {col.subcells!.map((cell, i) => (
                      <div
                        key={i}
                        className={`absolute top-0 h-4 flex items-center justify-center text-[9px] border-l border-slate-50 ${
                          cell.isToday ? 'bg-emerald-100 text-emerald-800 font-bold rounded' : 'text-slate-400'
                        }`}
                        style={{ left: `${(i / 7) * 100}%`, width: `${(1 / 7) * 100}%` }}
                      >
                        {cell.label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Cuerpo: filas de lotes + cuadrícula superpuesta */}
            <div className="flex relative" style={{ height: bodyHeight }}>
              <div style={{ width: GUTTER_WIDTH }} className="shrink-0 relative z-10">
                {activeLots.map((lot, i) => {
                  // Fases gateadas (Siembra/Injertación/Despacho) no tienen fecha fija
                  // que reprogramar — avanzan solas al completarse su actividad.
                  const isGated = isGatedPhaseCode(lot.active_cycle?.current_phase?.phase?.code ?? '');
                  return (
                    <div
                      key={lot.id}
                      className="absolute left-0 right-0 flex items-center justify-between pr-2"
                      style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                    >
                      <span className="text-xs font-medium text-slate-700 truncate" title={lot.name}>{lot.name}</span>
                      {!isGated && (
                        <button
                          type="button"
                          onClick={() => onReschedule(lot)}
                          className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-800 shrink-0 ml-1"
                        >
                          REPROGRAMACIÓN
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                className="relative flex-1 bg-slate-50/50 rounded-md"
                onMouseMove={handleTimelineMouseMove}
                onMouseLeave={handleTimelineMouseLeave}
              >
                {/* Franja resaltada de la columna bajo el mouse — misma columna que el
                    encabezado, en los 4 filtros. pointer-events-none: el mousemove lo
                    captura el contenedor (burbujea desde las barras si hay alguna
                    encima), esta franja es solo visual. */}
                {win.columns.map(col => (
                  <div
                    key={`hover-${col.key}`}
                    className={`absolute top-0 bottom-0 pointer-events-none transition-colors ${
                      hoveredColKey === col.key ? 'bg-emerald-100/40' : ''
                    }`}
                    style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}
                  />
                ))}
                {/* Líneas de cuadrícula (columnas superiores) */}
                {win.columns.map(col => (
                  <div
                    key={`grid-${col.key}`}
                    className="absolute top-0 bottom-0 border-l border-slate-200 pointer-events-none"
                    style={{ left: `${col.leftPct}%` }}
                  />
                ))}
                {/* Subdivisiones de días dentro de cada semana */}
                {mode === 'week' && win.columns.flatMap(col => col.subcells!.map((cell, i) => (
                  <div
                    key={`${col.key}-gridsub-${i}`}
                    className="absolute top-0 bottom-0 border-l border-slate-100"
                    style={{ left: `${cell.leftPct}%` }}
                  />
                )))}

                {/* Marcador de "hoy" */}
                {todayOffsetPct !== null && (mode === 'day' || mode === 'week') && (
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-200/40"
                    style={{ left: `${todayOffsetPct}%`, width: `${(1 / win.totalDays) * 100}%` }}
                  />
                )}
                {todayOffsetPct !== null && (mode === 'month' || mode === 'year') && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-rose-400 z-20"
                    style={{ left: `${todayOffsetPct}%` }}
                  />
                )}

                {/* Filas: barras de fase por lote */}
                {activeLots.map((lot, i) => {
                  const cycle = lot.active_cycle!;
                  const currentPhaseId = cycle.current_phase?.id;
                  return (
                    <div key={lot.id} className="absolute left-0 right-0" style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}>
                      {(cycle.phases ?? []).map(phase => {
                        const start = parseDate(phase.planned_start_date);
                        const isCurrent = phase.id === currentPhaseId;
                        const isGated = isGatedPhaseCode(phase.phase?.code ?? '');
                        const isPending = isGated && !phase.gate_completed_at;
                        const label = phase.phase?.name?.charAt(0).toUpperCase() ?? '';

                        // Siembra/Injertación/Despacho arrancan calculadas en 1 día — si
                        // su actividad se demora, el backend la extiende recién cuando se
                        // confirma (ver GatedPhaseCatalog). Mientras tanto, esta fase queda
                        // "congelada" como actual: para que se note el atraso en vez de
                        // mostrar una barra corta desfasada de "hoy", se estira la vista
                        // hasta hoy sin tocar la fecha real guardada.
                        const plannedEnd = phase.planned_end_date ? parseDate(phase.planned_end_date) : addDays(start, 1);
                        const isFrozen = isCurrent && isPending && today > plannedEnd;
                        const rawEnd = isFrozen ? addDays(today, 1) : addDays(plannedEnd, 1);
                        const end = rawEnd < win.end ? rawEnd : win.end;
                        const leftPct = toPct(start);
                        const widthPct = (diffDays(start, end) / win.totalDays) * 100;

                        const tooltipText = isGated
                          ? `${phase.phase?.name} (actividad obligatoria): ${phase.planned_start_date} – ${phase.planned_end_date}` +
                            (phase.gate_completed_at ? ' — confirmada' : isFrozen ? ' — atrasada, esperando confirmación en Tareas' : ' — esperando confirmación en Tareas')
                          : `${phase.phase?.name}: ${phase.planned_start_date} – ${phase.planned_end_date}`;

                        return (
                          <div
                            key={phase.id}
                            className={`group absolute flex items-center justify-center text-[9px] font-bold text-white/90 ${
                              isGated ? 'top-1 bottom-1 rounded-full' : 'top-2 bottom-2 rounded-sm'
                            }`}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              minWidth: isGated ? 8 : undefined,
                              backgroundColor: phase.phase?.color_reference || '#94a3b8',
                              opacity: isCurrent ? 1 : 0.55,
                              outline: isCurrent ? '2px solid white' : 'none',
                              outlineOffset: -1,
                            }}
                          >
                            {isGated && widthPct > 2 ? label : null}
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 flex w-max max-w-[220px] -translate-x-1/2 flex-col items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                              <span className="rounded-md bg-slate-800 px-2 py-1 text-center text-[11px] font-medium leading-snug text-white shadow-lg">
                                {tooltipText}
                              </span>
                              <span className="-mt-0.5 h-1.5 w-1.5 rotate-45 bg-slate-800" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
