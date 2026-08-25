import React, { useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { LotQrModal } from '../components/LotQrModal';
import { ProductionPanoramaPanel } from '../components/ProductionPanoramaPanel';
import { useLotesViewModel } from '../viewmodels/useLotesViewModel';
import { LotMovimientosPage } from './LotMovimientosPage';
import type { TrackingLot } from '../types';

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  occupied: 'Ocupado',
  inactive: 'Inactivo',
};

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
          {lot.current_status === 'occupied' ? 'Despacho / Salidas' : 'Ver Salidas'}
        </Button>
        <Button variant="secondary" onClick={onShowQr}>QR</Button>
      </div>
    </div>
  );
};

export const LotesPage: React.FC<LotesPageProps> = ({ openLotId, openLotNonce }) => {
  const {
    lots, summary, isLoading, enteredLotId, setEnteredLotId, qrLot, setQrLot,
    goals, selectedGoalId, selectGoal,
  } = useLotesViewModel();
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lotes</h1>
          <p className="text-sm text-slate-500 mt-1">Lotes administrados en Planificación — registra salidas y genera su QR aquí.</p>
        </div>
        {goals.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Meta de producción</label>
            <select
              value={selectedGoalId ?? ''}
              onChange={e => selectGoal(Number(e.target.value))}
              className="w-96 max-w-full text-sm font-medium text-slate-700 border border-slate-300 rounded-lg pl-3 pr-8 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {goals.map(g => (
                <option key={g.id} value={g.id}>
                  {!g.finished_at ? `Meta actual: ${g.title}` : g.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-[70%]">
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

        <div className="w-full lg:w-[30%] space-y-4">
          <ProductionPanoramaPanel summary={summary} isLoading={isLoading} />
        </div>
      </div>

      <LotQrModal lot={qrLot} onClose={() => setQrLot(null)} />
    </div>
  );
};
