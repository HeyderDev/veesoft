import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { TrackingProductionSummary } from '../types';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
}

interface ProductionPanoramaPanelProps {
  summary: TrackingProductionSummary | null;
  isLoading: boolean;
}

/**
 * "Panorama de producción" + "Próximas fechas de despacho" — extraído de
 * LotesPage para reusarse tal cual en el Dashboard general (se pidió
 * duplicar este contenido, no reinventarlo).
 */
export const ProductionPanoramaPanel: React.FC<ProductionPanoramaPanelProps> = ({ summary, isLoading }) => {
  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Panorama de producción</h2>
        {isLoading || !summary ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400">Plántulas en producción (en ciclo)</p>
              <p className="text-2xl font-bold text-emerald-600">{summary.total_in_production.toLocaleString('es')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Plántulas ya despachadas</p>
              <p className="text-2xl font-bold text-slate-700">{summary.total_dispatched.toLocaleString('es')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Próximas fechas de despacho</h2>
        {isLoading || !summary ? (
          <Skeleton className="h-16 w-full" />
        ) : summary.upcoming_dispatches.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No hay lotes próximos a despachar.</p>
        ) : (
          <ul className="space-y-2.5">
            {summary.upcoming_dispatches.map(d => (
              <li key={d.lot_id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 truncate">{d.lot_name}</span>
                <span className="text-xs font-medium text-slate-400 whitespace-nowrap ml-2">{formatDate(d.planned_date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};
