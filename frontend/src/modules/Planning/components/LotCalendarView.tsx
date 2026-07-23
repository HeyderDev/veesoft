import React, { useMemo, useState } from 'react';
import type { Lote } from '../types';
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

  const modeOptions: { id: CalendarMode; label: string }[] = [
    { id: 'day', label: 'Día' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'year', label: 'Año' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Calendario de Fases</h3>
          <p className="text-xs text-slate-500 mt-1">Cronograma de todos los lotes con ciclo activo en este vivero</p>
        </div>
        <div className="flex items-center gap-3">
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

      <div className="flex flex-wrap gap-3 mb-4">
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
        <div className="overflow-x-auto">
          <div style={{ minWidth: 720 }}>
            {/* Encabezado */}
            <div className="flex">
              <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
              <div className="relative flex-1 border-b border-slate-200" style={{ height: mode === 'week' ? 40 : 24 }}>
                {win.columns.map(col => (
                  <div
                    key={col.key}
                    className="absolute top-0 h-6 flex items-center justify-center text-[11px] font-semibold text-slate-500 border-l border-slate-100 truncate px-1"
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
                  const isDespacho = lot.active_cycle?.current_phase?.phase?.code === 'DESP';
                  return (
                    <div
                      key={lot.id}
                      className="absolute left-0 right-0 flex items-center justify-between pr-2"
                      style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                    >
                      <span className="text-xs font-medium text-slate-700 truncate" title={lot.name}>{lot.name}</span>
                      {!isDespacho && (
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

              <div className="relative flex-1 bg-slate-50/50 rounded-md overflow-hidden">
                {/* Líneas de cuadrícula (columnas superiores) */}
                {win.columns.map(col => (
                  <div
                    key={`grid-${col.key}`}
                    className="absolute top-0 bottom-0 border-l border-slate-200"
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
                        // Despacho no tiene fin planificado: en vez de estirar la barra
                        // indefinidamente, se limita a un recuadro de 1 día en la fecha de
                        // llegada y, si ese día ya pasó y el lote sigue en despacho, la barra
                        // crece día a día solo hasta hoy (nunca más allá).
                        const openEndedEnd = start < today ? addDays(today, 1) : addDays(start, 1);
                        const rawEnd = phase.planned_end_date ? addDays(parseDate(phase.planned_end_date), 1) : openEndedEnd;
                        const end = rawEnd < win.end ? rawEnd : win.end;
                        const leftPct = toPct(start);
                        const widthPct = (diffDays(start, end) / win.totalDays) * 100;
                        const isCurrent = phase.id === currentPhaseId;

                        return (
                          <div
                            key={phase.id}
                            title={`${phase.phase?.name}: ${phase.planned_start_date} – ${phase.planned_end_date ?? 'en curso (hasta hoy)'}`}
                            className="absolute top-1 bottom-1 rounded-sm"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: phase.phase?.color_reference || '#94a3b8',
                              opacity: isCurrent ? 1 : 0.55,
                              outline: isCurrent ? '2px solid white' : 'none',
                              outlineOffset: -1,
                            }}
                          />
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
