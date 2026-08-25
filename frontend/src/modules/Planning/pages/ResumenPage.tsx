import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { LotCalendarView } from '../components/LotCalendarView';
import { RescheduleModal } from '../components/RescheduleModal';
import { useResumenViewModel } from '../viewmodels/useResumenViewModel';

function formatMonth(value: string): string {
  const [y, m] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('es', { month: 'short', timeZone: 'UTC' });
}

interface ResumenPageProps {
  viveroId: number;
}

export const ResumenPage: React.FC<ResumenPageProps> = ({ viveroId }) => {
  const {
    summary, lots, isLoadingSummary,
    selectedYear, setSelectedYear,
    goalForm, setGoalForm, isSavingGoal, handleCreateGoal,
    rescheduleTarget, openReschedule, closeReschedule, isReschedulingSaving, handleConfirmReschedule,
  } = useResumenViewModel(viveroId);

  const chartData = (summary?.projection_vs_reality ?? []).map(row => ({
    name: formatMonth(row.month),
    proyectadas: row.projected,
    reales: row.actual,
  }));

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
          {/* Calendario a ancho completo */}
          <LotCalendarView lots={lots} onReschedule={openReschedule} />

          {/* Proyección vs Realidad, con filtro de año */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-[90%] mx-auto">
            <div className="mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Proyección vs Realidad</h3>
                <p className="text-xs text-slate-500 mt-1">Plántulas despachadas — planificado vs. real, mes a mes</p>
              </div>
              <div className="flex items-center gap-1 mt-3">
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
            <div className="overflow-x-auto lg:overflow-visible -mx-1 px-1">
              <div className="h-[300px] min-w-[640px] lg:min-w-0">
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
