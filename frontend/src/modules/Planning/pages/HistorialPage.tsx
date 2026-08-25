import React, { useEffect, useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { planningService } from '../services/planningService';
import type { EstadoMeta, MetaHistorialEntry } from '../types';

const metaStatusLabel: Record<EstadoMeta, string> = {
  not_started: 'No iniciada',
  active: 'Activa',
  completed: 'Completada',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
}

/**
 * Historial de metas de producción: reemplaza la antigua pestaña "Reportes"
 * (que en realidad era la cola de despachos pendientes de Seguimiento, movida
 * a su propio tab en Tracking). Una meta culminada nunca pierde su historial
 * — solo deja de poder recibir ciclos/actividades nuevos.
 */
export const HistorialPage: React.FC = () => {
  const [goals, setGoals] = useState<MetaHistorialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await planningService.getGoalsHistory();
        setGoals(res.data || []);
      } catch (err) {
        error('Error al cargar el historial de metas');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [error]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Historial de Metas</h1>
        <p className="text-sm text-slate-500 mt-1">Todas las metas de producción del vivero, activas y culminadas, con sus números acumulados.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">Este vivero todavía no tiene metas de producción.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Meta</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Objetivo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Despachadas</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actividades realizadas</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Lotes utilizados</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ciclos productivos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Culminada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {goals.map(goal => (
                  <tr key={goal.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{goal.title}</span>
                        <Badge variant={goal.status === 'active' ? 'success' : goal.status === 'completed' ? 'info' : 'neutral'}>
                          {metaStatusLabel[goal.status]}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{goal.target_seedlings.toLocaleString('es')}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{goal.produced_seedlings.toLocaleString('es')}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{goal.tasks_completed_count.toLocaleString('es')}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{goal.distinct_lots_count.toLocaleString('es')}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{goal.lot_cycles_count.toLocaleString('es')}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">{formatDate(goal.finished_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
