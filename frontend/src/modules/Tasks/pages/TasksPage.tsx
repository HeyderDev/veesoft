import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Modal } from '../../../components/ui/Modal';
import { TaskFormSlideOver, StatusBadge, PriorityBadge } from '../components/TaskFormSlideOver';
import { TaskReportPanel } from '../components/TaskReportPanel';
import { TemplatesTab } from '../components/TemplatesTab';
import { useTasksViewModel, type TaskTab } from '../viewmodels/useTasksViewModel';
import type { LotInfo, OperationalTask } from '../types';
import { tasksService } from '../services/tasksService';
import { useAuth } from '../../../shared/context/AuthContext';

// ---- Filtros de estado ----
const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
] as const;

const HISTORY_TYPE_FILTERS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'general', label: 'Generales' },
  { value: 'lot', label: 'Por Lote' },
] as const;

// ---- Formato de fecha ----
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-EC', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ---- Fila de tarea ----
interface TaskRowProps {
  task: OperationalTask;
  onEdit: (task: OperationalTask) => void;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  canManage: boolean;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onEdit, onComplete, onDelete, canManage }) => (
  <tr className="group hover:bg-slate-50 transition-colors">
    <td className="px-4 py-3">
      <div className="font-medium text-slate-800 text-sm">{task.title}</div>
      {task.description && (
        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{task.description}</div>
      )}
      {task.lot_id && (
        <div className="text-xs text-emerald-600 font-medium mt-1">
          Lote: {task.lot_id}
        </div>
      )}
      {task.resources && task.resources.length > 0 && (
        <div className="text-xs text-slate-400 mt-1 flex gap-2">
          <span>{task.resources.filter(r => r.resource_type === 'tool').length} herr.</span>
          <span>{task.resources.filter(r => r.resource_type === 'supply').length} ins.</span>
        </div>
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
      {task.assigned_to
        ? `Trabajador ID: ${task.assigned_to}`
        : <span className="text-slate-400 italic">Sin asignar</span>}
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status !== 'completed' && (
          <button
            id={`complete-task-${task.id}`}
            onClick={() => onComplete(task.id)}
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
              title="Editar tarea"
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
              title="Eliminar tarea"
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

// ---- Página principal ----
export const TasksPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    activeTab, setActiveTab,
    // Generales
    generalTasks, isLoadingGeneral, currentPage, lastPage, fetchGeneralTasks,
    statusFilterGeneral, setStatusFilterGeneral,
    // Por Lote
    lotTasks, isLoadingLot, selectedLotId, setSelectedLotId,
    // Historial
    historyTasks, isLoadingHistory,
    historyFilterType, setHistoryFilterType,
    historyFilterStatus, setHistoryFilterStatus,
    // Modal state
    isCreateOpen, openCreate, closeCreate,
    createForm, setCreateForm, isSaving, handleCreate,
    editingTask, editForm, setEditForm, openEdit, closeEdit,
    isSavingEdit, handleSaveEdit,
    completingTaskId, isCompleting, openComplete, closeComplete, handleComplete,
    deletingTaskId, isDeleting, openDelete, closeDelete, handleDelete,
  } = useTasksViewModel();

  // Lots combo
  const [lots, setLots] = useState<LotInfo[]>([]);
  useEffect(() => {
    if (activeTab === 'lot') {
      tasksService.getLots().then(res => setLots(Array.isArray((res as any).data) ? (res as any).data : []));
    }
  }, [activeTab]);

  const tabs: { id: TaskTab; label: string; icon: string }[] = [
    { id: 'general', label: 'Actividades Generales', icon: '📋' },
    { id: 'lot', label: 'Actividades por Lote', icon: '🌱' },
    { id: 'templates', label: 'Plantillas de Actividad', icon: '⚙️' },
    ...(isAdmin ? [
      { id: 'history' as const, label: 'Historial', icon: '🕒' },
      { id: 'report' as const, label: 'Reporte General', icon: '📊' },
    ] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tareas y Actividades</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión integral de actividades, asignación de lotes e inventario.
          </p>
        </div>
        {isAdmin && activeTab !== 'report' && activeTab !== 'history' && (
          <Button id="btn-new-task" onClick={openCreate}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Actividad
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Generales */}
      {activeTab === 'general' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilterGeneral(f.value)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilterGeneral === f.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {isLoadingGeneral ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-center"><Skeleton className="h-4 flex-1" /></div>
                ))}
              </div>
            ) : generalTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No hay tareas generales.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarea</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prioridad</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha planif.</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Asignado a</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {generalTasks.map(task => (
                      <TaskRow key={task.id} task={task} onEdit={openEdit} onComplete={openComplete} onDelete={openDelete} canManage={isAdmin} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {lastPage > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="secondary" disabled={currentPage === 1} onClick={() => fetchGeneralTasks(currentPage - 1)}>← Anterior</Button>
              <span className="px-4 py-2 text-sm text-slate-600">Página {currentPage} de {lastPage}</span>
              <Button variant="secondary" disabled={currentPage === lastPage} onClick={() => fetchGeneralTasks(currentPage + 1)}>Siguiente →</Button>
            </div>
          )}
        </div>
      )}

      {/* TAB: Por Lote */}
      {activeTab === 'lot' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Seleccionar lote:</label>
            <select
              value={selectedLotId || ''}
              onChange={e => setSelectedLotId(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Seleccione un lote para ver sus actividades...</option>
              {lots.map(lot => (
                <option key={lot.id} value={lot.id}>{lot.name} ({lot.code})</option>
              ))}
            </select>
          </div>

          {selectedLotId ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {isLoadingLot ? (
                <div className="p-6"><Skeleton className="h-4 w-1/2" /></div>
              ) : lotTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Este lote no tiene actividades asignadas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarea</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prioridad</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha planif.</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Asignado a</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lotTasks.map(task => (
                        <TaskRow key={task.id} task={task} onEdit={openEdit} onComplete={openComplete} onDelete={openDelete} canManage={isAdmin} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 italic">Selecciona un lote arriba para visualizar sus tareas.</div>
          )}
        </div>
      )}

      {/* TAB: Plantillas */}
      {activeTab === 'templates' && <TemplatesTab />}

      {/* TAB: Historial */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-4 flex-wrap">
            <div className="flex gap-2">
              {HISTORY_TYPE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setHistoryFilterType(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    historyFilterType === f.value ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="flex gap-2">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setHistoryFilterStatus(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    historyFilterStatus === f.value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {isLoadingHistory ? (
              <div className="p-6"><Skeleton className="h-4 w-1/2" /></div>
            ) : historyTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No se encontraron resultados en el historial con los filtros actuales.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarea</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prioridad</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha planif.</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Asignado a</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {historyTasks.map(task => (
                      <TaskRow key={task.id} task={task} onEdit={openEdit} onComplete={openComplete} onDelete={openDelete} canManage={isAdmin} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Reporte */}
      {activeTab === 'report' && <TaskReportPanel />}

      {/* SlideOver: Crear */}
      <TaskFormSlideOver
        isOpen={isCreateOpen}
        onClose={closeCreate}
        title="Nueva Actividad"
        subtitle="Registra una actividad y asígnala (opcionalmente) a un lote."
        showLotSelector={true}
        form={createForm}
        setForm={f => setCreateForm(f as typeof createForm)}
        isSaving={isSaving}
        onSubmit={handleCreate}
      />

      {/* SlideOver: Editar */}
      <TaskFormSlideOver
        isOpen={!!editingTask}
        onClose={closeEdit}
        title="Editar Actividad"
        subtitle={editingTask?.title}
        showLotSelector={false} // El lote no se edita aquí, por diseño
        form={editForm}
        setForm={f => setEditForm(f as typeof editForm)}
        isSaving={isSavingEdit}
        onSubmit={handleSaveEdit}
      />

      {/* Modal: Confirmar completar */}
      <Modal
        isOpen={completingTaskId !== null}
        onClose={closeComplete}
        title="Marcar como realizada"
        subtitle="¿Está seguro de marcar esta actividad como realizada? (Se asignará a su usuario actual)"
        maxWidthClassName="max-w-sm"
      >
        <div className="p-6 space-y-4">
          <div className="flex gap-3 pt-2">
            <Button
              id="btn-confirm-complete"
              className="flex-1"
              variant="primary"
              disabled={isCompleting}
              onClick={handleComplete}
            >
              {isCompleting ? 'Guardando...' : 'Confirmar'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={closeComplete}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar eliminar */}
      <Modal
        isOpen={deletingTaskId !== null}
        onClose={closeDelete}
        title="Eliminar tarea"
        maxWidthClassName="max-w-sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            ¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button
              id="btn-confirm-delete"
              variant="danger"
              className="flex-1"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={closeDelete}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
