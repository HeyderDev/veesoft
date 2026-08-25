import React from 'react';

interface TotalActivitiesStatProps {
  completed: number;
  total: number;
}

/**
 * Bloque "Realizadas / Total + barra + %" — usado tanto en el encabezado de
 * ActivitiesSection (Tareas) como en la card del Dashboard general, para no
 * duplicar el mismo diseño en dos lugares.
 */
export const TotalActivitiesStat: React.FC<TotalActivitiesStatProps> = ({ completed, total }) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-end gap-6">
        <div>
          <p className="text-4xl font-extrabold text-emerald-600 leading-none tracking-tight">{completed}</p>
          <p className="text-xs font-medium text-slate-400 mt-1.5">Realizadas</p>
        </div>
        <div className="w-px self-stretch bg-slate-100" />
        <div>
          <p className="text-4xl font-extrabold text-slate-400 leading-none tracking-tight">{total}</p>
          <p className="text-xs font-medium text-slate-400 mt-1.5">Total</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        {total > 0 && <span className="text-sm font-bold text-emerald-600 shrink-0">{pct}%</span>}
      </div>
    </div>
  );
};
