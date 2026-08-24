import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ClientSearchSelect } from '../components/ClientSearchSelect';
import { useMovimientosViewModel } from '../viewmodels/useMovimientosViewModel';

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

interface LotMovimientosPageProps {
  lotId: number;
  onBack: () => void;
}

export const LotMovimientosPage: React.FC<LotMovimientosPageProps> = ({ lotId, onBack }) => {
  const {
    lot, movements, isLoading, client, setClient, quantity, setQuantity,
    notes, setNotes, isSaving, handleRegister,
  } = useMovimientosViewModel(lotId);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 transition-colors"
        >
          ← Lotes
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">{lot?.name ?? `Lote #${lotId}`}</span>
      </div>

      <form onSubmit={handleRegister} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Registrar salida</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
          <ClientSearchSelect value={client} onChange={setClient} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            min={1}
            max={lot?.total_capacity}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observación</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          />
        </div>

        <Button type="submit" isLoading={isSaving}>Registrar salida</Button>
      </form>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Historial de este lote</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : movements.length === 0 ? (
          <p className="text-sm text-slate-400">Sin salidas registradas todavía.</p>
        ) : (
          <div className="space-y-2">
            {movements.map(m => (
              <div key={m.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {m.tracking_client?.name ?? 'Cliente eliminado'} · {m.quantity}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(m.movement_date)}{m.notes ? ` · ${m.notes}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-amber-600">↑ Salida</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
