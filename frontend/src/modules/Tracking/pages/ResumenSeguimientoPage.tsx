import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useResumenSeguimientoViewModel } from '../viewmodels/useResumenSeguimientoViewModel';

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export const ResumenSeguimientoPage: React.FC = () => {
  const {
    mode, setMode, lots, selectedLotId, setSelectedLotId,
    general, lotReport, isLoading, exportPdf,
  } = useResumenSeguimientoViewModel();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reportes</h1>
          <p className="text-sm text-slate-500 mt-1">Totales globales o el historial de un lote específico.</p>
        </div>
        <Button onClick={exportPdf}>Exportar PDF</Button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('general')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${mode === 'general' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}
        >
          Reporte general
        </button>
        <button
          type="button"
          onClick={() => setMode('lot')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${mode === 'lot' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}
        >
          Reporte por lote
        </button>
      </div>

      {mode === 'lot' && (
        <select
          value={selectedLotId ?? ''}
          onChange={e => setSelectedLotId(Number(e.target.value))}
          className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        >
          {lots.map(lot => <option key={lot.id} value={lot.id}>{lot.name}</option>)}
        </select>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : mode === 'general' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-slate-800">{general?.total_lots ?? 0}</p>
              <p className="text-sm text-slate-500 mt-1">Lotes totales</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-slate-800">{general?.total_dispatched ?? 0}</p>
              <p className="text-sm text-slate-500 mt-1">Plántulas despachadas</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Clientes con más plántulas recibidas</h2>
            {(general?.top_clients.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-400">Sin salidas registradas todavía.</p>
            ) : (
              <div className="space-y-2">
                {general?.top_clients.map(c => (
                  <div key={c.tracking_client_id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                    <span className="text-slate-700">{c.name}</span>
                    <span className="text-sm font-semibold text-emerald-600">{c.total_quantity} plántulas</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {lotReport && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="font-semibold text-slate-800">{lotReport.lot.name}</p>
              <p className="text-xs text-slate-400">Código {lotReport.lot.code} · Capacidad {lotReport.lot.total_capacity.toLocaleString('es')}</p>
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Historial de salidas</h2>
            {(lotReport?.movements.data.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-400">Sin salidas registradas todavía.</p>
            ) : (
              <div className="space-y-2">
                {lotReport?.movements.data.map(m => (
                  <div key={m.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{m.tracking_client?.name ?? 'Cliente eliminado'}</p>
                      <p className="text-xs text-slate-400">{formatDate(m.movement_date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-600">{m.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
