import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useResumenSeguimientoViewModel } from '../viewmodels/useResumenSeguimientoViewModel';

export const ResumenSeguimientoPage: React.FC = () => {
  const { summary, alerts, isLoading, exportPdf, stageLabels } = useResumenSeguimientoViewModel();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Resumen de Seguimiento</h1>
          <p className="text-sm text-slate-500 mt-1">Existencias totales y alertas de stock bajo.</p>
        </div>
        <Button onClick={exportPdf} disabled={!summary}>Exportar PDF</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-slate-800">{summary?.total_items ?? 0}</p>
          <p className="text-sm text-slate-500 mt-1">Lotes en seguimiento</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-slate-800">{summary?.total_quantity ?? 0}</p>
          <p className="text-sm text-slate-500 mt-1">Plántulas totales</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Por etapa de crecimiento</h2>
        <div className="space-y-2">
          {Object.entries(summary?.by_stage ?? {}).map(([stage, data]) => (
            <div key={stage} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
              <span className="text-slate-700">{stageLabels[stage] ?? stage}</span>
              <span className="text-sm text-slate-500">{data.quantity} plántulas ({data.items_count} lotes)</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Alertas de stock bajo ({alerts.length})</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-400">No hay lotes por debajo del stock mínimo.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map(item => (
              <div key={item.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-800">{item.name}</p>
                <p className="text-xs text-red-600">
                  Existencias: {item.quantity} · Mínimo requerido: {item.minimum_stock} · {item.location}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
