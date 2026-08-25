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
  const { activeVivero, viveroOverview, pendingTasks, atRiskResources, isLoading } = usePlanningOverviewViewModel();

  const openGoal = viveroOverview?.openGoal ?? null;
  const lotStatusCounts = viveroOverview?.lotStatusCounts ?? null;
  const target = openGoal ? Number(openGoal.target_seedlings) : 0;
  const produced = openGoal ? Number(openGoal.produced_seedlings ?? 0) : 0;
  const progressPct = target > 0 ? Math.min(100, Math.round((produced / target) * 100)) : 0;
  const totalLots = lotStatusCounts
    ? lotStatusCounts.available + lotStatusCounts.occupied + lotStatusCounts.inactive
    : 0;
  const todayTasks = pendingTasks.filter(task => task.isToday);

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
            <p className="text-sm font-medium text-slate-500 mb-1">Actividades programadas</p>
            <p className="text-3xl font-bold text-slate-800">{pendingTasks.length}</p>
            <p className={`mt-1 text-xs font-medium ${todayTasks.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {todayTasks.length} para hoy
            </p>
          </div>
          <div className={`rounded-xl border p-5 shadow-sm ${atRiskResources.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <p className={`text-sm font-medium mb-1 ${atRiskResources.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>Recursos con disponibilidad insuficiente</p>
            <p className={`text-3xl font-bold ${atRiskResources.length > 0 ? 'text-red-700' : 'text-slate-800'}`}>{atRiskResources.length}</p>
          </div>
        </div>
      )}

      {/* Recursos en riesgo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Recursos en Riesgo</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            El sistema reserva primero los recursos de las actividades prioritarias de hoy y después los de las siguientes fechas. Se alerta cuando el saldo ya no alcanza para una actividad posterior.
          </p>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : atRiskResources.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Los recursos disponibles cubren todas las actividades pendientes mostradas.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recurso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Disponible / programado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Requerido por</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {atRiskResources.map(resource => (
                <tr key={`${resource.resourceType}:${resource.resourceId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">{resource.resourceType === 'supply' ? 'Insumo' : 'Herramienta'}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{resource.name}{resource.sku ? ` (${resource.sku})` : ''}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {resource.availableQuantity} / {resource.totalRequestedQuantity} {resource.unit}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{resource.taskTitles.join(', ')}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="danger">Insuficiente</Badge>
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
          <p className="text-xs text-slate-500 mt-0.5">Solo se muestran las actividades de hoy y de fechas futuras. Las actividades de hoy aparecen primero como prioritarias.</p>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : pendingTasks.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No hay actividades pendientes para hoy ni para fechas futuras.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actividad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Alcance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha planificada</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recursos asignados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingTasks.map(task => (
                <tr key={task.id} className={task.isToday ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      {task.title}
                      {task.isToday && <Badge variant="danger">HOY · Prioritaria</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {task.viveroName ?? '—'}{task.isGeneral ? ' · Actividad general' : task.lotCode ? ` · ${task.lotCode}` : ''}
                  </td>
                  <td className={`px-4 py-3 text-sm ${task.isToday ? 'font-semibold text-rose-700' : 'text-slate-500'}`}>{task.planned_date}</td>
                  <td className="px-4 py-3">
                    {task.priority ? <Badge variant={priorityVariants[task.priority]}>{priorityLabels[task.priority]}</Badge> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {task.supplyResources.length === 0 && task.toolResources.length === 0 ? (
                      <span className="text-xs text-slate-400">Ninguno</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {task.supplyResources.map(r => (
                          <Badge key={r.resourceId} variant={r.isCritical ? 'danger' : 'neutral'}>
                            {r.supply?.name ?? `Insumo #${r.resourceId}`} ({r.requestedQuantity}{r.supply?.unit ?? ''}){r.isCritical ? ' ⚠' : ''}
                          </Badge>
                        ))}
                        {task.toolResources.map(r => (
                          <Badge key={r.resourceId} variant={r.isCritical ? 'danger' : 'info'}>
                            {r.tool?.name ?? `Herramienta #${r.resourceId}`} ({r.requestedQuantity} unidad{r.requestedQuantity === 1 ? '' : 'es'}){r.isCritical ? ' ⚠' : ''}
                          </Badge>
                        ))}
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
