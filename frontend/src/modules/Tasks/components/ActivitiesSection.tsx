import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../shared/context/AuthContext';
import { TaskFormSlideOver, StatusBadge, PriorityBadge } from './TaskFormSlideOver';
import { ActivitiesCalendar } from './ActivitiesCalendar';
import { TotalActivitiesStat } from './TotalActivitiesStat';
import { useTasksViewModel } from '../viewmodels/useTasksViewModel';
import { tasksService } from '../services/tasksService';
import type { ActivitiesSummaryEntry, LotInfo, OperationalTask } from '../types';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
] as const;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ---- Card con dona de progreso — clickeable, abre el listado de esa card ----
const SummaryCard: React.FC<{ label: string; data: ActivitiesSummaryEntry; onClick: () => void }> = ({ label, data, onClick }) => {
  const pending = Math.max(data.total - data.completed, 0);
  const chartData = data.total > 0 ? [
    { name: 'Realizadas', value: data.completed },
    { name: 'Pendientes', value: pending },
  ] : [];

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-500 mb-1 truncate">{label}</p>
        <p className="tracking-tight">
          <span className="text-xl font-bold text-slate-800">{data.completed}</span>
          <span className="text-sm font-normal text-slate-400"> / {data.total}</span>
        </p>
      </div>
      <div className="w-16 h-16 shrink-0 flex items-center justify-center">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={18} outerRadius={28} paddingAngle={3} dataKey="value">
                <Cell fill="#10b981" />
                <Cell fill="#e2e8f0" />
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <span className="w-14 h-14 rounded-full border-4 border-slate-100" />
        )}
      </div>
    </button>
  );
};

// ---- Fila de actividad (mobile) — solo Actividad/Estado; el resto vive en el detalle (TaskDetailModal) ----
interface TaskRowProps {
  task: OperationalTask;
  lots: LotInfo[];
  onSelect: (task: OperationalTask) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, lots, onSelect }) => {
  const lot = lots.find(l => l.id === task.lot_id);

  return (
    <tr onClick={() => onSelect(task)} className="hover:bg-slate-50 transition-colors cursor-pointer">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-800 text-sm">{task.title}</div>
        {task.lot_id && (
          <div className="text-xs text-emerald-600 font-medium mt-1">
            Lote: {lot?.name ?? task.lot_id}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={task.status} />
      </td>
    </tr>
  );
};

// ---- Fila de actividad (desktop, lg+) — todas las columnas y acciones inline ----
interface TaskRowFullProps {
  task: OperationalTask;
  lots: LotInfo[];
  users: { id: number; name: string }[];
  onEdit: (task: OperationalTask) => void;
  onComplete: (task: OperationalTask) => void;
  onDelete: (id: number) => void;
  canManage: boolean;
}

const TaskRowFull: React.FC<TaskRowFullProps> = ({ task, lots, users, onEdit, onComplete, onDelete, canManage }) => {
  const assignedUser = users.find(u => u.id === task.assigned_to);
  const lot = lots.find(l => l.id === task.lot_id);
  const needsResources = !!task.activity_type?.is_system && (!task.resources || task.resources.length === 0);

  return (
    <tr className="group hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-800 text-sm">{task.title}</div>
        {task.description && (
          <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{task.description}</div>
        )}
        {task.lot_id && (
          <div className="text-xs text-emerald-600 font-medium mt-1">
            Lote: {lot?.name ?? task.lot_id}
          </div>
        )}
        {task.resources && task.resources.length > 0 && (
          <div className="text-xs text-slate-400 mt-1 flex gap-2">
            <span>{task.resources.filter(r => r.resource_type === 'tool').length} herr.</span>
            <span>{task.resources.filter(r => r.resource_type === 'supply').length} ins.</span>
          </div>
        )}
        {needsResources && (
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            Faltan herramientas/insumos — completar
          </button>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={task.status} />
      </td>
      <td className="px-4 py-3">
        <PriorityBadge priority={task.priority} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
        {formatDate(task.planned_date)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {assignedUser
          ? assignedUser.name
          : <span className="text-slate-400 italic">Sin asignar</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== 'completed' && (
            <button
              id={`complete-task-${task.id}`}
              onClick={() => onComplete(task)}
              title="Marcar como completada"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Completar
            </button>
          )}
          {canManage && (
            <>
              <button
                id={`edit-task-${task.id}`}
                onClick={() => onEdit(task)}
                title="Editar actividad"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                id={`delete-task-${task.id}`}
                onClick={() => onDelete(task.id)}
                title="Eliminar actividad"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// ---- Detalle de actividad — se abre al seleccionar una fila del listado ----
interface TaskDetailModalProps {
  task: OperationalTask | null;
  lots: LotInfo[];
  users: { id: number; name: string }[];
  canManage: boolean;
  onClose: () => void;
  onEdit: (task: OperationalTask) => void;
  onComplete: (task: OperationalTask) => void;
  onDelete: (id: number) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, lots, users, canManage, onClose, onEdit, onComplete, onDelete }) => {
  const assignedUser = task ? users.find(u => u.id === task.assigned_to) : undefined;
  const lot = task ? lots.find(l => l.id === task.lot_id) : undefined;
  const needsResources = !!task?.activity_type?.is_system && (!task.resources || task.resources.length === 0);

  return (
    <Modal isOpen={!!task} onClose={onClose} title={task?.title ?? ''} maxWidthClassName="max-w-lg">
      {task && (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>

          {task.description && <p className="text-sm text-slate-600">{task.description}</p>}

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Fecha planificada</dt>
              <dd className="text-slate-700">{formatDate(task.planned_date)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Asignado a</dt>
              <dd className="text-slate-700">
                {assignedUser ? assignedUser.name : <span className="text-slate-400 italic">Sin asignar</span>}
              </dd>
            </div>
            {task.lot_id && (
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Lote</dt>
                <dd className="text-emerald-600 font-medium">{lot?.name ?? task.lot_id}</dd>
              </div>
            )}
            {task.resources && task.resources.length > 0 && (
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Recursos</dt>
                <dd className="text-slate-700">
                  {task.resources.filter(r => r.resource_type === 'tool').length} herr. · {task.resources.filter(r => r.resource_type === 'supply').length} ins.
                </dd>
              </div>
            )}
          </dl>

          {needsResources && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              Faltan herramientas/insumos — completar
            </button>
          )}

          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            {task.status !== 'completed' && (
              <Button id={`complete-task-${task.id}`} onClick={() => onComplete(task)}>
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Marcar como realizada
              </Button>
            )}
            {canManage && (
              <>
                <Button id={`edit-task-${task.id}`} variant="secondary" onClick={() => onEdit(task)}>Editar</Button>
                <Button id={`delete-task-${task.id}`} variant="danger" onClick={() => onDelete(task.id)}>Eliminar</Button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

// ---- Modal de completar — flujo simple, o doble confirmación de Despacho ----
interface CompleteTaskModalProps {
  task: OperationalTask | null;
  isCompleting: boolean;
  dispatchPreview: { lot_name: string; quantity: number } | null;
  isLoadingDispatchPreview: boolean;
  dispatchStep: 'preview' | 'confirm';
  onContinue: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({
  task, isCompleting, dispatchPreview, isLoadingDispatchPreview, dispatchStep, onContinue, onBack, onConfirm, onClose,
}) => {
  const isDispatch = task?.activity_type?.system_code === 'DISPATCH' && !!task?.lot_cycle_phase_id;

  if (!isDispatch) {
    return (
      <Modal
        isOpen={!!task}
        onClose={onClose}
        title="Marcar como realizada"
        subtitle="¿Está seguro de marcar esta actividad como realizada? (Se asignará a su usuario actual)"
        maxWidthClassName="max-w-sm"
      >
        <div className="p-6 space-y-4">
          <div className="flex gap-3 pt-2">
            <Button id="btn-confirm-complete" className="flex-1" variant="primary" disabled={isCompleting} onClick={onConfirm}>
              {isCompleting ? 'Guardando...' : 'Confirmar'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    );
  }

  const quantity = dispatchPreview?.quantity ?? 0;
  const lotName = dispatchPreview?.lot_name ?? task?.title ?? '';

  return (
    <Modal
      isOpen={!!task}
      onClose={onClose}
      title={dispatchStep === 'preview' ? `Completar Despacho — Lote ${lotName}` : 'Confirmar Despacho'}
      maxWidthClassName="max-w-sm"
    >
      <div className="p-6 space-y-4">
        {isLoadingDispatchPreview ? (
          <Skeleton className="h-16 w-full" />
        ) : dispatchStep === 'preview' ? (
          <>
            <p className="text-sm text-slate-600">
              Según los movimientos de salida registrados en Seguimiento, el lote <strong>{lotName}</strong> despachó{' '}
              <strong className="text-emerald-600 text-base">{quantity} plántulas</strong>. Esta cantidad se sumará al progreso de la meta y quedará como el dato real de producción.
            </p>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" variant="primary" onClick={onContinue}>Continuar</Button>
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              ¿Confirmas que el lote <strong>{lotName}</strong> despachó <strong className="text-emerald-600">{quantity} plántulas</strong>? Esta acción liberará el lote para un nuevo ciclo.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={onBack}>Volver</Button>
              <Button id="btn-confirm-complete" className="flex-1" variant="primary" disabled={isCompleting} onClick={onConfirm}>
                {isCompleting ? 'Guardando...' : 'Confirmar Despacho'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

type ViewMode = 'cards' | 'list';

export const ActivitiesSection: React.FC = () => {
  const { isAdmin } = useAuth();
  const vm = useTasksViewModel();

  const [lots, setLots] = useState<LotInfo[]>([]);
  useEffect(() => {
    tasksService.getLots().then(res => setLots(Array.isArray((res as any).data) ? (res as any).data : [])).catch(() => setLots([]));
  }, []);

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [activeLabel, setActiveLabel] = useState('');
  const [detailTask, setDetailTask] = useState<OperationalTask | null>(null);

  const handleEditFromDetail = (task: OperationalTask) => { setDetailTask(null); vm.openEdit(task); };
  const handleCompleteFromDetail = (task: OperationalTask) => { setDetailTask(null); vm.openComplete(task); };
  const handleDeleteFromDetail = (id: number) => { setDetailTask(null); vm.openDelete(id); };

  const openScope = (scope: typeof vm.scopeFilter, label: string) => {
    vm.setScopeFilter(scope);
    vm.setStatusFilter('all');
    setActiveLabel(label);
    setViewMode('list');
  };

  const backToCards = () => {
    setViewMode('cards');
    vm.setScopeFilter('all');
    vm.setSearch('');
    vm.setStatusFilter('all');
  };

  const handleSearchChange = (value: string) => {
    vm.setSearch(value);
    if (viewMode === 'cards' && value.trim()) {
      vm.setScopeFilter('all');
      setActiveLabel('Resultados de búsqueda');
      setViewMode('list');
    }
  };

  const overall = vm.summary?.overall ?? { completed: 0, total: 0 };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Dato de TOTAL — sin recuadro, más llamativo que las cards individuales */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total de actividades</p>
            {vm.goals.length > 0 && (
              <select
                value={vm.selectedGoalId ?? ''}
                onChange={e => vm.selectGoal(Number(e.target.value))}
                className="text-sm font-medium text-slate-700 border border-slate-300 rounded-lg pl-3 pr-8 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {vm.goals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.id === vm.summary?.open_goal?.id ? `Meta actual: ${g.title}` : g.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          {vm.isLoadingSummary ? (
            <Skeleton className="h-16 w-64" />
          ) : (
            <>
              <div className="max-w-xs">
                <TotalActivitiesStat completed={overall.completed} total={overall.total} />
              </div>
              {overall.total === 0 && !vm.summary?.open_goal && (
                <p className="text-xs text-slate-400 mt-2 max-w-sm">
                  No hay una meta de producción activa — los contadores se reinician con cada meta nueva.
                </p>
              )}
              {overall.total === 0 && vm.summary?.open_goal && vm.selectedGoalId !== vm.summary.open_goal.id && (
                <p className="text-xs text-slate-400 mt-2 max-w-sm">
                  Esta meta todavía no tiene actividades registradas.
                </p>
              )}
            </>
          )}
        </div>
        {isAdmin && (
          <Button id="btn-new-task" onClick={vm.openCreateChooser}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Actividad
          </Button>
        )}
      </div>

      {/* Layout 70/30: cards+búsqueda / calendario */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="w-full lg:w-[70%] space-y-4">
          {/* Buscador — siempre visible en el componente padre de las cards */}
          <input
            type="text"
            value={vm.search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar actividades por título o descripción..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />

          {viewMode === 'cards' ? (
            vm.isLoadingSummary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : vm.summary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <SummaryCard label="Generales" data={vm.summary.general} onClick={() => openScope('general', 'Actividades Generales')} />
                {vm.summary.by_lot.map(l => (
                  <SummaryCard
                    key={l.lot_id}
                    label={`Lote: ${l.lot_name}`}
                    data={{ completed: l.completed, total: l.total }}
                    onClick={() => openScope(`lot:${l.lot_id}`, `Lote: ${l.lot_name}`)}
                  />
                ))}
              </div>
            ) : null
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={backToCards}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver a Actividades
                </button>
                <div className="flex gap-2">
                  {STATUS_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => vm.setStatusFilter(f.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        vm.statusFilter === f.value ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <h3 className="font-bold text-slate-800">{activeLabel}</h3>

              {vm.isLoadingTasks ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-[90%] mx-auto p-6 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="flex gap-4 items-center"><Skeleton className="h-4 flex-1" /></div>)}
                </div>
              ) : vm.tasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-[90%] mx-auto p-8 text-center text-slate-500">No se encontraron actividades con los filtros actuales.</div>
              ) : (
                <>
                  {/* Desktop: tabla completa (lg+) */}
                  <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-[90%] mx-auto">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/60">
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actividad</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prioridad</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha planif.</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Asignado a</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {vm.tasks.map(task => (
                            <TaskRowFull
                              key={task.id}
                              task={task}
                              lots={lots}
                              users={vm.users}
                              onEdit={vm.openEdit}
                              onComplete={vm.openComplete}
                              onDelete={vm.openDelete}
                              canManage={isAdmin}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile: solo Actividad/Estado, el resto vive en el detalle (lg:hidden) */}
                  <div className="lg:hidden bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/60">
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actividad</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {vm.tasks.map(task => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              lots={lots}
                              onSelect={setDetailTask}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              {vm.lastPage > 1 && (
                <div className="flex justify-center gap-2">
                  <Button variant="secondary" disabled={vm.currentPage === 1} onClick={() => vm.fetchTasks(vm.currentPage - 1)}>← Anterior</Button>
                  <span className="px-4 py-2 text-sm text-slate-600">Página {vm.currentPage} de {vm.lastPage}</span>
                  <Button variant="secondary" disabled={vm.currentPage === vm.lastPage} onClick={() => vm.fetchTasks(vm.currentPage + 1)}>Siguiente →</Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full lg:w-[30%]">
          <ActivitiesCalendar
            year={vm.calendarYear}
            month={vm.calendarMonth}
            days={vm.calendarDays}
            isLoading={vm.isLoadingCalendar}
            onPrev={vm.goToPrevMonth}
            onNext={vm.goToNextMonth}
          />
        </div>
      </div>

      {/* Chooser: Plantilla / Libre */}
      <Modal
        isOpen={vm.createMode === 'choosing'}
        onClose={vm.closeCreate}
        title="Nueva Actividad"
        subtitle="¿Cómo quieres registrarla?"
        maxWidthClassName="max-w-lg"
      >
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => vm.chooseCreateMode('template')}
            className="text-left p-5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors"
          >
            <p className="font-semibold text-slate-800 mb-1">Desde Plantilla</p>
            <p className="text-xs text-slate-500">Elige una plantilla predeterminada y la fecha — el resto de datos se completan automáticamente.</p>
          </button>
          <button
            type="button"
            onClick={() => vm.chooseCreateMode('free')}
            className="text-left p-5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors"
          >
            <p className="font-semibold text-slate-800 mb-1">Libre</p>
            <p className="text-xs text-slate-500">Registra una actividad nueva llenando todos los datos manualmente.</p>
          </button>
        </div>
      </Modal>

      {/* SlideOver: Crear desde Plantilla */}
      <TaskFormSlideOver
        isOpen={vm.createMode === 'template'}
        onClose={vm.closeCreate}
        mode="template"
        title="Nueva Actividad — Desde Plantilla"
        subtitle="Elige la plantilla y la fecha; el resto se copia automáticamente."
        showLotSelector={true}
        users={vm.users}
        form={vm.templateForm}
        setForm={f => vm.setTemplateForm(f)}
        isSaving={vm.isSaving}
        onSubmit={vm.handleCreate}
      />

      {/* SlideOver: Crear Libre */}
      <TaskFormSlideOver
        isOpen={vm.createMode === 'free'}
        onClose={vm.closeCreate}
        mode="free"
        title="Nueva Actividad — Libre"
        subtitle="Registra una actividad y asígnala (opcionalmente) a un lote."
        showLotSelector={true}
        users={vm.users}
        form={vm.freeForm}
        setForm={f => vm.setFreeForm(f)}
        isSaving={vm.isSaving}
        onSubmit={vm.handleCreate}
      />

      {/* SlideOver: Editar */}
      <TaskFormSlideOver
        isOpen={!!vm.editingTask}
        onClose={vm.closeEdit}
        mode="free"
        title="Editar Actividad"
        subtitle={vm.editingTask?.title}
        showLotSelector={false} // El lote no se edita aquí, por diseño
        users={vm.users}
        form={vm.editForm}
        setForm={f => vm.setEditForm(f)}
        isSaving={vm.isSavingEdit}
        onSubmit={vm.handleSaveEdit}
      />

      {/* Modal: Detalle de la actividad seleccionada en el listado */}
      <TaskDetailModal
        task={detailTask}
        lots={lots}
        users={vm.users}
        canManage={isAdmin}
        onClose={() => setDetailTask(null)}
        onEdit={handleEditFromDetail}
        onComplete={handleCompleteFromDetail}
        onDelete={handleDeleteFromDetail}
      />

      {/* Modal: Confirmar completar (simple, o doble confirmación de Despacho) */}
      <CompleteTaskModal
        task={vm.completingTask}
        isCompleting={vm.isCompleting}
        dispatchPreview={vm.dispatchPreview}
        isLoadingDispatchPreview={vm.isLoadingDispatchPreview}
        dispatchStep={vm.dispatchStep}
        onContinue={vm.continueDispatchConfirm}
        onBack={vm.backToDispatchPreview}
        onConfirm={vm.handleComplete}
        onClose={vm.closeComplete}
      />

      {/* Modal: Confirmar eliminar */}
      <Modal
        isOpen={vm.deletingTaskId !== null}
        onClose={vm.closeDelete}
        title="Eliminar actividad"
        maxWidthClassName="max-w-sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <Button id="btn-confirm-delete" variant="danger" className="flex-1" disabled={vm.isDeleting} onClick={vm.handleDelete}>
              {vm.isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={vm.closeDelete}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
