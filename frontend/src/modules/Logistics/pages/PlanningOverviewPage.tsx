import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { usePlanningOverviewViewModel } from '../viewmodels/usePlanningOverviewViewModel';

const priorityLabels: Record<'high' | 'medium' | 'low', string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const priorityVariants: Record<'high' | 'medium' | 'low', 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

export const PlanningOverviewPage: React.FC = () => {
  const { activeVivero, viveroOverview, pendingTasks, atRiskSupplies, isLoading } = usePlanningOverviewViewModel();

  const openGoal = viveroOverview?.openGoal ?? null;
  const lotStatusCounts = viveroOverview?.lotStatusCounts ?? null;
  const target = openGoal ? Number(openGoal.target_seedlings) : 0;
  const produced = openGoal ? Number(openGoal.produced_seedlings ?? 0) : 0;
  const progressPct = target > 0 ? Math.min(100, Math.round((produced / target) * 100)) : 0;
  const totalLots = lotStatusCounts
    ? lotStatusCounts.available + lotStatusCounts.occupied + lotStatusCounts.inactive
    : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Panorama de Planificación</h1>
        <p className="text-sm text-slate-500 mt-1">
          Producción, actividades e insumos de {activeVivero ? activeVivero.name : 'este vivero'}, para anticipar compras
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Meta activa</p>
            {openGoal ? (
              <>
                <p className="text-sm font-semibold text-slate-800">{openGoal.title}</p>
                <div className="mt-2 flex justify-between text-xs text-slate-500 mb-1">
                  <span>{produced.toLocaleString('es')}/{target.toLocaleString('es')}</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPct}%` }} />
                </div>
              </>
            ) : (
              <p className="text-lg font-semibold text-slate-400">Sin meta activa</p>
            )}
            {lotStatusCounts && (
              <p className="text-xs text-slate-400 mt-2">Lotes ocupados: {lotStatusCounts.occupied}/{totalLots}</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Actividades pendientes</p>
            <p className="text-3xl font-bold text-slate-800">{pendingTasks.length}</p>
          </div>
          <div className={`rounded-xl border p-5 shadow-sm ${atRiskSupplies.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <p className={`text-sm font-medium mb-1 ${atRiskSupplies.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>Insumos en riesgo (usados en tareas pendientes)</p>
            <p className={`text-3xl font-bold ${atRiskSupplies.length > 0 ? 'text-red-700' : 'text-slate-800'}`}>{atRiskSupplies.length}</p>
          </div>
        </div>
      )}

      {/* Insumos en riesgo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Insumos en Riesgo</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Insumos asignados a actividades pendientes cuyo stock actual ya está en el mínimo o por debajo — candidatos para una nueva Solicitud u Orden de Compra.
          </p>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : atRiskSupplies.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Ningún insumo asignado a actividades pendientes está en estado crítico.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Insumo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock actual / mínimo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Requerido por</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {atRiskSupplies.map(({ supply, taskTitles }) => (
                <tr key={supply.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{supply.sku}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{supply.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {Number(supply.current_stock).toFixed(2)} / {Number(supply.min_stock).toFixed(2)} {supply.unit}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{taskTitles.join(', ')}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="danger">
                      {Number(supply.current_stock) <= 0 ? 'Insuficiente' : 'Crítico'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Actividades pendientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Actividades Pendientes de Planificación</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tareas operativas de Planificación aún no completadas, con los insumos que tienen asignados.</p>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : pendingTasks.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No hay actividades pendientes asociadas a la planificación.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actividad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vivero / Lote</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha planificada</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Insumos asignados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{task.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {task.viveroName ?? '—'}{task.lotCode ? ` · ${task.lotCode}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{task.planned_date}</td>
                  <td className="px-4 py-3">
                    {task.priority ? <Badge variant={priorityVariants[task.priority]}>{priorityLabels[task.priority]}</Badge> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {task.supplyResources.length === 0 && task.toolResourceCount === 0 ? (
                      <span className="text-xs text-slate-400">Ninguno</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {task.supplyResources.map(r => (
                          <Badge key={r.resourceId} variant={r.isCritical ? 'danger' : 'neutral'}>
                            {r.supply?.name ?? `Insumo #${r.resourceId}`}{r.isCritical ? ' ⚠' : ''}
                          </Badge>
                        ))}
                        {task.toolResourceCount > 0 && (
                          <Badge variant="info">{task.toolResourceCount} herramienta(s)</Badge>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
