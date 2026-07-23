import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useReportesViewModel } from '../viewmodels/useReportesViewModel';

function formatDate(value: string): string {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

interface ReportesPageProps {
  viveroId: number;
}

/**
 * Único lugar donde se registra cuánto se despachó realmente. Un ciclo llega aquí
 * cuando su lote se liberó (Terminar Despacho en Lotes) pero todavía nadie reportó
 * la cantidad — mientras tanto, Resumen Operativo simplemente no lo cuenta.
 */
export const ReportesPage: React.FC<ReportesPageProps> = ({ viveroId }) => {
  const { pending, isLoading, quantities, setQuantityFor, submittingId, submitReport } = useReportesViewModel(viveroId);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reportes de Despacho</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ciclos ya cerrados a la espera de que se registre cuánto se despachó realmente.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">No hay despachos pendientes de reportar en este vivero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">{item.lot.name}</p>
                <p className="text-xs text-slate-400">
                  Código {item.lot.code} · Ciclo iniciado el {formatDate(item.started_at)} · Capacidad {item.lot.total_capacity.toLocaleString('es')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={item.lot.total_capacity}
                  value={quantities[item.id] ?? item.lot.total_capacity}
                  onChange={e => setQuantityFor(item.id, Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
                <Button
                  type="button"
                  variant="primary"
                  isLoading={submittingId === item.id}
                  onClick={() => submitReport(item.id)}
                >
                  Reportar despacho
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
