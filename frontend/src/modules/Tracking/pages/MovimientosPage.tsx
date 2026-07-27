import React from 'react';
import { Button } from '../../../components/ui/Button';
import { useMovimientosViewModel } from '../viewmodels/useMovimientosViewModel';

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export const MovimientosPage: React.FC = () => {
  const {
    items, movements, isLoading, historyFilterId, setHistoryFilterId,
    selectedItemId, setSelectedItemId, type, setType, quantity, setQuantity,
    notes, setNotes, isSaving, handleRegister,
  } = useMovimientosViewModel();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Movimientos de Inventario</h1>
        <p className="text-sm text-slate-500 mt-1">Registra entradas y salidas de plántulas por lote.</p>
      </div>

      <form onSubmit={handleRegister} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lote *</label>
          <select
            value={selectedItemId ?? ''}
            onChange={e => setSelectedItemId(Number(e.target.value))}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          >
            {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('entry')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border ${type === 'entry' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}
          >
            ↓ Entrada
          </button>
          <button
            type="button"
            onClick={() => setType('exit')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border ${type === 'exit' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-300'}`}
          >
            ↑ Salida
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            min={1}
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

        <Button type="submit" isLoading={isSaving} disabled={items.length === 0}>Registrar movimiento</Button>
      </form>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Historial de movimientos</h2>
          <select
            value={historyFilterId ?? ''}
            onChange={e => setHistoryFilterId(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          >
            <option value="">Todos los lotes</option>
            {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : movements.length === 0 ? (
          <p className="text-sm text-slate-400">Sin movimientos registrados todavía.</p>
        ) : (
          <div className="space-y-2">
            {movements.map(m => (
              <div key={m.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {m.tracking_item?.name ?? `Lote #${m.tracking_item_id}`} · {m.quantity}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(m.movement_date)}{m.notes ? ` · ${m.notes}` : ''}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${m.type === 'entry' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {m.type === 'entry' ? '↓ Entrada' : '↑ Salida'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
