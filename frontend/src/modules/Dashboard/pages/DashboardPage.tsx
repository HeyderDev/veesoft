import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Building2, CheckCircle2, Sprout, Target } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { KpiCard } from '../../Planning/components/KpiCard';
import { TotalActivitiesStat } from '../../Tasks/components/TotalActivitiesStat';
import { ProductionPanoramaPanel } from '../../Tracking/components/ProductionPanoramaPanel';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
}

interface DashboardPageProps {
  onNavigateToSettings?: () => void;
  onNavigateToModule?: (moduleId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToSettings, onNavigateToModule }) => {
  const {
    activeVivero,
    goals, selectedGoalId, selectGoal, openGoal, selectedGoal,
    dispatchedSeedlings, activitiesSummary, tasksPreview, productionSummary, isLoadingGoalData,
    viveroSummary, isLoadingVivero,
    totalTools, totalSupplies, isLoadingInventory,
    atRiskResources, isLoadingAtRisk,
  } = useDashboardViewModel();

  const target = selectedGoal ? Number(selectedGoal.target_seedlings) : 0;
  const produced = dispatchedSeedlings ?? 0;
  const metaPct = target > 0 ? Math.min(100, Math.round((produced / target) * 100)) : 0;
  const canCulminar = !!selectedGoal && !!openGoal && selectedGoal.id === openGoal.id
    && target > 0 && produced / target >= 0.8 && !!onNavigateToSettings;

  const lotStatusCounts = viveroSummary?.lot_status_counts ?? null;
  const totalLots = lotStatusCounts ? lotStatusCounts.available + lotStatusCounts.occupied + lotStatusCounts.inactive : 0;
  const phaseData = (viveroSummary?.phase_distribution ?? []).filter(p => p.code !== 'PREP' && p.capacity > 0);

  const overall = activitiesSummary?.overall ?? { completed: 0, total: 0 };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard General</h1>
          <p className="text-sm text-slate-500 mt-1">
            Vista global de {activeVivero?.name ?? 'este vivero'} — producción, actividades, seguimiento e inventario en un solo lugar.
          </p>
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

      {/* Izquierda (3/4): KPIs físicos + Seguimiento + Inventario/Riesgo apilados — Derecha (1/4): Actividades, misma altura total */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 space-y-5">
          {/* Meta Actual + Producción en curso + Lotes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-4">
                <Target className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Meta Actual</p>
              {isLoadingGoalData ? (
                <Skeleton className="h-8 w-32" />
              ) : selectedGoal ? (
                <>
                  <p className="mb-1 tracking-tight">
                    <span className="text-3xl font-bold text-slate-800">{produced.toLocaleString('es')}</span>
                    <span className="text-lg font-normal text-slate-400"> / {target.toLocaleString('es')}</span>
                  </p>
                  <p className="text-xs text-slate-400 truncate">{selectedGoal.title}</p>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${metaPct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{metaPct}% de avance</p>
                  {canCulminar && (
                    <button
                      type="button"
                      onClick={onNavigateToSettings}
                      className="mt-3 w-full text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg py-1.5 transition-colors"
                    >
                      Culminar Meta →
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Sin meta de producción todavía.</p>
              )}
            </div>

            {/* Producción en curso — fusión de "En Producción" + dona de distribución por fase */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-4">
                <Sprout className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Producción en curso</p>
              {isLoadingVivero ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <div className="shrink-0">
                    <p className="text-2xl font-bold text-slate-800 tracking-tight">{(viveroSummary?.production_capacity ?? 0).toLocaleString('es')}</p>
                    <p className="text-xs text-slate-400">plántulas desde Siembra</p>
                  </div>
                  <div className="flex-1 min-h-[110px] max-w-[150px] ml-auto">
                    {phaseData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={110}>
                        <PieChart>
                          <Pie data={phaseData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={3} dataKey="capacity">
                            {phaseData.map(item => <Cell key={item.phase_id} fill={item.color_reference} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="block w-20 h-20 rounded-full border-4 border-slate-100 mx-auto" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <KpiCard
              title="Lotes"
              value={`${lotStatusCounts?.occupied ?? 0}/${totalLots}`}
              subtitle="Lotes Activos / Lotes Totales"
              color="violet"
              icon={Building2}
              isLoading={isLoadingVivero}
            />
          </div>

          {/* Seguimiento — ligado a meta (duplicado tal cual de Seguimiento > Lotes) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Seguimiento</h3>
              {onNavigateToModule && (
                <button type="button" onClick={() => onNavigateToModule('tracking')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  Ver en Seguimiento →
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProductionPanoramaPanel summary={productionSummary} isLoading={isLoadingGoalData} />
            </div>
          </div>

          {/* Inventario + Recursos en riesgo — no ligados a meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">Inventario</h3>
                {onNavigateToModule && (
                  <button type="button" onClick={() => onNavigateToModule('inventory')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                    Ver →
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  {isLoadingInventory ? <Skeleton className="h-8 w-16 mx-auto" /> : (
                    <p className="text-3xl font-bold text-slate-800">{totalTools ?? 0}</p>
                  )}
                  <p className="text-sm text-slate-500 mt-1">Herramientas totales</p>
                </div>
                <div>
                  {isLoadingInventory ? <Skeleton className="h-8 w-16 mx-auto" /> : (
                    <p className="text-3xl font-bold text-slate-800">{totalSupplies ?? 0}</p>
                  )}
                  <p className="text-sm text-slate-500 mt-1">Insumos totales</p>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border shadow-sm p-5 text-center ${atRiskResources.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              {isLoadingAtRisk ? <Skeleton className="h-8 w-16 mx-auto" /> : (
                <p className={`text-3xl font-bold ${atRiskResources.length > 0 ? 'text-red-700' : 'text-slate-800'}`}>{atRiskResources.length}</p>
              )}
              <p className={`text-sm mt-1 ${atRiskResources.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>Recursos en riesgo</p>
            </div>
          </div>

          {/* Detalle de recursos en riesgo — solo si hay algo que mostrar */}
          {atRiskResources.length > 0 && (
            <div className="rounded-xl border border-red-200 shadow-sm overflow-x-auto">
              <div className="px-5 py-4 border-b border-slate-100 bg-white rounded-t-xl">
                <h3 className="text-sm font-bold text-slate-800">Detalle de recursos en riesgo</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cruce de todas las actividades pendientes del vivero contra el stock disponible en Inventario.</p>
              </div>
              <table className="min-w-full divide-y divide-slate-100 bg-white">
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
                      <td className="px-4 py-3 text-sm text-slate-600">{resource.availableQuantity} / {resource.totalRequestedQuantity} {resource.unit}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{resource.taskTitles.join(', ')}</td>
                      <td className="px-4 py-3 text-right"><Badge variant="danger">Insuficiente</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Total de Actividades + Actividades próximas — ligado a meta, misma columna/ancho que antes */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full flex flex-col hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total de Actividades</p>
            {isLoadingGoalData ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <TotalActivitiesStat completed={overall.completed} total={overall.total} />
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Actividades próximas</p>
                {onNavigateToModule && (
                  <button type="button" onClick={() => onNavigateToModule('tasks')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 shrink-0">
                    Ver todas →
                  </button>
                )}
              </div>
              {isLoadingGoalData ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}</div>
              ) : tasksPreview.length === 0 ? (
                <p className="text-sm text-slate-400">No hay actividades pendientes para esta meta.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto">
                  {tasksPreview.map(task => (
                    <div key={task.id}>
                      <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400">{task.lotName ?? 'General'} · {formatDate(task.planned_date)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
