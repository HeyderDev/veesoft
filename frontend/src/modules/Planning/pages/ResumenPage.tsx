import React from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { KpiCard } from '../components/KpiCard';
import { LotCalendarView } from '../components/LotCalendarView';
import { RescheduleModal } from '../components/RescheduleModal';
import { useResumenViewModel } from '../viewmodels/useResumenViewModel';

function formatMonth(value: string): string {
  const [y, m] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('es', { month: 'short', timeZone: 'UTC' });
}

interface ResumenPageProps {
  viveroId: number;
  onNavigateToSettings?: () => void;
}

export const ResumenPage: React.FC<ResumenPageProps> = ({ viveroId, onNavigateToSettings }) => {
  const {
    summary, lots, isLoadingSummary,
    dispatchedSeedlings, isLoadingDispatched,
    goalLotCycles, isLoadingGoalLotCycles,
    selectedYear, setSelectedYear,
    goalForm, setGoalForm, isSavingGoal, handleCreateGoal,
    rescheduleTarget, openReschedule, closeReschedule, isReschedulingSaving, handleConfirmReschedule,
  } = useResumenViewModel(viveroId);

  const chartData = (summary?.projection_vs_reality ?? []).map(row => ({
    name: formatMonth(row.month),
    proyectadas: row.projected,
    reales: row.actual,
  }));

  const target = summary?.open_goal?.target_seedlings ?? 0;

  const lotesActivos = summary?.lot_status_counts.occupied ?? 0;
  const lotesTotales = summary
    ? summary.lot_status_counts.available + summary.lot_status_counts.occupied + summary.lot_status_counts.inactive
    : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Resumen Operativo</h1>
        <p className="text-sm text-slate-500 mt-1">Visión estratégica y estado actual del vivero</p>
      </div>

      {isLoadingSummary && !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : !summary?.open_goal ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Este vivero no tiene una meta activa</h3>
          <p className="text-sm text-slate-500 mb-5">Crea una meta de producción para empezar a ver su avance aquí.</p>
          <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
              <input
                value={goalForm.title}
                onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Ej: Producción Anual 2026"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Plántulas objetivo *</label>
              <input
                type="number"
                min={1}
                value={goalForm.target_seedlings}
                onChange={e => setGoalForm({ ...goalForm, target_seedlings: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <Button type="submit" isLoading={isSavingGoal} className="w-full">Crear Meta</Button>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
              <textarea
                value={goalForm.description}
                onChange={e => setGoalForm({ ...goalForm, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm resize-none"
              />
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* 4 tarjetas en fila: Meta Actual, En Producción, Lotes, y la dona de distribución */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-2xl text-white shadow-lg shadow-emerald-200 mb-4">
                🎯
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Meta Actual</p>
              <p className="mb-1 tracking-tight">
                {isLoadingDispatched && dispatchedSeedlings === undefined ? (
                  <span className="inline-block h-8 w-16 rounded bg-slate-100 animate-pulse align-middle" />
                ) : (
                  <span className="text-3xl font-bold text-slate-800">
                    {(dispatchedSeedlings ?? 0).toLocaleString('es')}
                  </span>
                )}
                <span className="text-lg font-normal text-slate-400"> / {target.toLocaleString('es')}</span>
              </p>
              <p className="text-xs text-slate-400 truncate">{summary.open_goal.title}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Plántulas despachadas · fuente: Reportes</p>
              {target > 0 && (dispatchedSeedlings ?? 0) / target >= 0.8 && onNavigateToSettings && (
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="mt-3 w-full text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg py-1.5 transition-colors"
                >
                  Culminar Meta →
                </button>
              )}
            </div>
            <KpiCard
              title="En Producción"
              value={summary.production_capacity.toLocaleString('es')}
              subtitle="plántulas desde Siembra en adelante"
              color="blue"
              icon="🌱"
            />
            <KpiCard
              title="Lotes"
              value={`${lotesActivos}/${lotesTotales}`}
              subtitle="Lotes Activos / Lotes Totales"
              color="violet"
              icon="🏗️"
            />

            {/* Dona "Plántulas en Producción" — misma proporción/tamaño que las demás tarjetas */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <p className="text-sm font-medium text-slate-500 mb-1">Plántulas en Producción</p>
              <p className="text-xs text-slate-400 mb-2">Distribución por fase (desde Siembra)</p>
              <div className="flex-1 min-h-[140px] flex items-center justify-center">
                {summary.phase_distribution.some(p => p.code !== 'PREP' && p.capacity > 0) ? (
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={summary.phase_distribution.filter(p => p.code !== 'PREP' && p.capacity > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={52}
                        paddingAngle={4}
                        dataKey="capacity"
                        nameKey="name"
                      >
                        {summary.phase_distribution.filter(p => p.code !== 'PREP' && p.capacity > 0).map(item => (
                          <Cell key={item.phase_id} fill={item.color_reference} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#1e293b', fontWeight: 500 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400 text-center">Ningún lote en producción todavía</p>
                )}
              </div>
            </div>
          </div>

          {/* Calendario a ancho completo */}
          <LotCalendarView lots={lots} onReschedule={openReschedule} />

          {/* Histórico de ciclos de la meta actual */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-1">Histórico de la meta</h3>
            <p className="text-xs text-slate-500 mb-4">Todos los ciclos de lote asociados a "{summary.open_goal.title}"</p>
            {isLoadingGoalLotCycles ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : goalLotCycles.length === 0 ? (
              <p className="text-sm text-slate-400">Todavía no hay ciclos registrados para esta meta.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="py-2 pr-4 font-medium">Lote</th>
                      <th className="py-2 pr-4 font-medium">Iniciado</th>
                      <th className="py-2 pr-4 font-medium">Estado</th>
                      <th className="py-2 pr-4 font-medium">Última fase iniciada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalLotCycles.map(cycle => (
                      <tr key={cycle.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 pr-4 font-medium text-slate-700">{cycle.lot?.name ?? `Lote #${cycle.lot_id}`}</td>
                        <td className="py-2 pr-4 text-slate-500">{cycle.started_at}</td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cycle.status === 'dispatched' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
                            {cycle.status === 'dispatched' ? 'Despachado' : 'En curso'}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-slate-500">
                          {cycle.phases?.slice().sort((a, b) => (a.planned_start_date > b.planned_start_date ? -1 : 1))[0]?.phase?.name ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Proyección vs Realidad, a ancho completo, con filtro de año */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Proyección vs Realidad</h3>
                <p className="text-xs text-slate-500 mt-1">Plántulas despachadas — planificado vs. real, mes a mes</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedYear(y => y - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  ‹
                </button>
                <span className="text-sm font-semibold text-slate-700 w-14 text-center">{selectedYear}</span>
                <button
                  type="button"
                  onClick={() => setSelectedYear(y => y + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProyectadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="proyectadas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProyectadas)" name="Proyectadas" />
                  <Area type="monotone" dataKey="reales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorReales)" name="Reales" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <RescheduleModal
        lote={rescheduleTarget}
        onClose={closeReschedule}
        isSaving={isReschedulingSaving}
        onConfirm={handleConfirmReschedule}
      />
    </div>
  );
};
