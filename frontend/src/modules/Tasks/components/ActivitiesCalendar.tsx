import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { CalendarDayCount } from '../types';

interface ActivitiesCalendarProps {
  year: number;
  month: number; // 1-12
  days: CalendarDayCount[];
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const MONTH_LABELS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Lunes = 0 ... Domingo = 6 (misma convención que el resto del módulo Planning).
function mondayFirstWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export const ActivitiesCalendar: React.FC<ActivitiesCalendarProps> = ({ year, month, days, isLoading, onPrev, onNext }) => {
  const countByDate = new Map(days.map(d => [d.date, d.count]));

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstOffset = mondayFirstWeekday(new Date(year, month - 1, 1));

  const cells: (number | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = (() => {
    const t = new Date();
    return toDateKey(t.getFullYear(), t.getMonth() + 1, t.getDate());
  })();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700 text-xs uppercase tracking-wide">Calendario</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs leading-none"
          >
            ‹
          </button>
          <span className="text-[11px] font-semibold text-slate-700 w-16 text-center">{MONTH_LABELS_SHORT[month - 1]} {year}</span>
          <button
            type="button"
            onClick={onNext}
            className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs leading-none"
          >
            ›
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={`${label}-${i}`} className="text-center text-[9px] font-semibold text-slate-400 pb-0.5">
              {label}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
            const key = toDateKey(year, month, day);
            const count = countByDate.get(key) ?? 0;
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={`relative aspect-square rounded flex items-center justify-center ${
                  isToday ? 'bg-emerald-50 ring-1 ring-emerald-300' : ''
                }`}
              >
                <span className={`text-[9px] ${isToday ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>{day}</span>
                {count > 0 && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
