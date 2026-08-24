import React, { useEffect } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { LotQrModal } from '../components/LotQrModal';
import { useLotesViewModel } from '../viewmodels/useLotesViewModel';
import { LotMovimientosPage } from './LotMovimientosPage';

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

export const LotesPage: React.FC<LotesPageProps> = ({ openLotId, openLotNonce }) => {
  const { lots, isLoading, enteredLotId, setEnteredLotId, qrLot, setQrLot } = useLotesViewModel();

  useEffect(() => {
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : lots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">No hay lotes registrados todavía en Planificación.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map(lot => (
            <div key={lot.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{lot.name}</p>
                  <p className="text-xs text-slate-400">Código {lot.code}</p>
                </div>
                <Badge variant={lot.current_status === 'available' ? 'success' : lot.current_status === 'occupied' ? 'info' : 'neutral'}>
                  {statusLabels[lot.current_status] ?? lot.current_status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {lot.vivero?.name ?? 'Sin vivero'} · Capacidad {lot.total_capacity.toLocaleString('es')}
              </p>
              <div className="flex gap-2 mt-auto">
                <Button variant="primary" className="flex-1" onClick={() => setEnteredLotId(lot.id)}>
                  Movimientos
                </Button>
                <Button variant="secondary" onClick={() => setQrLot(lot)}>QR</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <LotQrModal lot={qrLot} onClose={() => setQrLot(null)} />
    </div>
  );
};
