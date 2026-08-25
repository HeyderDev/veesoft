import React, { useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { LotQrModal } from '../components/LotQrModal';
import { useLotesViewModel } from '../viewmodels/useLotesViewModel';
import { LotMovimientosPage } from './LotMovimientosPage';
import type { TrackingLot } from '../types';

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  occupied: 'Ocupado',
  inactive: 'Inactivo',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
}

interface LotesPageProps {
  /** Lote a abrir directamente (por ejemplo, tras escanear su QR) y un contador
   * que cambia en cada escaneo, para poder re-entrar al mismo lote dos veces seguidas. */
  openLotId?: number | null;
  openLotNonce?: number;
}

interface LotCardProps {
  lot: TrackingLot;
  isDispatchTooltipOpen: boolean;
  onToggleDispatchTooltip: () => void;
  onEnter: () => void;
  onShowQr: () => void;
}

const LotCard: React.FC<LotCardProps> = ({ lot, isDispatchTooltipOpen, onToggleDispatchTooltip, onEnter, onShowQr }) => {
  const isReadyToDispatch = lot.current_phase?.code === 'DESP';

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
      {isReadyToDispatch && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <button
            type="button"
            onClick={onToggleDispatchTooltip}
            className="w-4 h-4 rounded-full bg-red-500 ring-2 ring-white animate-pulse hover:animate-none"
            aria-label="Lote listo para despachar"
          />
          {isDispatchTooltipOpen && (
            <div className="absolute right-0 top-6 z-20 w-52 rounded-lg bg-slate-800 text-white text-xs px-3 py-2 shadow-lg">
              El lote está listo para despachar.
              <span className="absolute -top-1 right-1.5 w-2 h-2 bg-slate-800 rotate-45" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">{lot.name}</p>
          <p className="text-xs text-slate-400">Código {lot.code}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={lot.current_status === 'available' ? 'success' : lot.current_status === 'occupied' ? 'info' : 'neutral'}>
            {statusLabels[lot.current_status] ?? lot.current_status}
          </Badge>
          {lot.current_status === 'occupied' && lot.current_phase && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: lot.current_phase.color_reference }}
            >
              {lot.current_phase.name}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {lot.vivero?.name ?? 'Sin vivero'} · Capacidad {lot.total_capacity.toLocaleString('es')}
      </p>

      <div className="flex gap-2 mt-auto">
        <Button variant="primary" className="flex-1" onClick={onEnter}>
          Movimientos
        </Button>
        <Button variant="secondary" onClick={onShowQr}>QR</Button>
      </div>
    </div>
  );
};

export const LotesPage: React.FC<LotesPageProps> = ({ openLotId, openLotNonce }) => {
  const { lots, summary, isLoading, enteredLotId, setEnteredLotId, qrLot, setQrLot } = useLotesViewModel();
  const [dispatchTooltipLotId, setDispatchTooltipLotId] = useState<number | null>(null);

  React.useEffect(() => {
    if (openLotId) setEnteredLotId(openLotId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openLotNonce]);

  if (enteredLotId) {
    return <LotMovimientosPage lotId={enteredLotId} onBack={() => setEnteredLotId(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lotes</h1>
        <p className="text-sm text-slate-500 mt-1">Lotes administrados en Planificación — registra salidas y genera su QR aquí.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : lots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-500">No hay lotes registrados todavía en Planificación.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lots.map(lot => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  isDispatchTooltipOpen={dispatchTooltipLotId === lot.id}
                  onToggleDispatchTooltip={() => setDispatchTooltipLotId(id => (id === lot.id ? null : lot.id))}
                  onEnter={() => setEnteredLotId(lot.id)}
                  onShowQr={() => setQrLot(lot)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0 space-y-4">
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
        </div>
      </div>

      <LotQrModal lot={qrLot} onClose={() => setQrLot(null)} />
    </div>
  );
};
