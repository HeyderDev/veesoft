import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { tasksService } from '../services/tasksService';
import axiosClient from '../../../shared/services/axiosClient';
import type {
  ActivitiesSummary,
  CalendarDayCount,
  DispatchPreview,
  OperationalTask,
  TaskCreateInput,
  TaskGoal,
  TaskTemplateCreateInput,
  TaskUpdateInput,
} from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as any).response;
    if (response?.data?.errors) {
      // Tomar el primer error de validación
      const firstError = Object.values(response.data.errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
    }
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const EMPTY_FREE_FORM: TaskCreateInput = {
  title: '',
  description: '',
  observations: '',
  planned_date: new Date().toISOString().split('T')[0],
  priority: 'medium',
  lot_id: null,
  assigned_to: null,
  resources: [],
};

const EMPTY_TEMPLATE_FORM: TaskTemplateCreateInput = {
  activity_type_id: 0,
  planned_date: new Date().toISOString().split('T')[0],
  lot_id: null,
  assigned_to: null,
};

export type { TaskTab } from '../types';

import { useTasksNav } from '../hooks/useTasksNav';

export function useTasksViewModel() {
  const { success, error } = useToast();
  const { user } = useAuth();

  // ---- Pestañas ----
  const { activeSection: activeTab, setActiveSection: setActiveTab } = useTasksNav();

  // ---- Selector de meta — arranca en null hasta que fetchSummary() resuelve
  // cuál es la meta abierta (open_goal); a partir de ahí, todas las cards,
  // el calendario y el listado quedan scoped a la meta seleccionada (la
  // abierta por defecto, o una culminada si el usuario la elige). ----
  const [goals, setGoals] = useState<TaskGoal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await tasksService.getGoals() as unknown as { data: TaskGoal[] };
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'activities') fetchGoals();
  }, [activeTab, fetchGoals]);

  const selectGoal = (goalId: number) => setSelectedGoalId(goalId);

  // ---- Actividades (búsqueda unificada: generales + por lote) ----
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | `lot:${number}`>('all');

  const fetchTasks = useCallback(async (page = 1) => {
    setIsLoadingTasks(true);
    try {
      const res = await tasksService.getTasks({
        page,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        scope: scopeFilter === 'all' ? undefined : scopeFilter,
        goal_id: selectedGoalId ?? undefined,
      }) as unknown as { data: OperationalTask[]; meta: { current_page: number; last_page: number } };
      setTasks(res.data);
      setCurrentPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al cargar las actividades'));
    } finally {
      setIsLoadingTasks(false);
    }
  }, [error, search, statusFilter, scopeFilter, selectedGoalId]);

  // Debounce corto en la búsqueda de texto para no golpear la API en cada tecla.
  useEffect(() => {
    if (activeTab !== 'activities') return;
    const t = setTimeout(() => fetchTasks(1), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, statusFilter, scopeFilter, selectedGoalId]);

  // ---- Cards de resumen (meta seleccionada) ----
  const [summary, setSummary] = useState<ActivitiesSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const res = await tasksService.getSummary(selectedGoalId ?? undefined) as unknown as { data: ActivitiesSummary };
      setSummary(res.data);
      // Primer load: todavía no hay meta seleccionada — se autoselecciona la
      // abierta (si existe). No pisa una elección posterior del usuario.
      if (selectedGoalId === null && res.data.open_goal) {
        setSelectedGoalId(res.data.open_goal.id);
      }
    } catch (err) {
      error(extractErrorMessage(err, 'Error al cargar el resumen de actividades'));
    } finally {
      setIsLoadingSummary(false);
    }
  }, [error, selectedGoalId]);

  useEffect(() => {
    if (activeTab === 'activities') fetchSummary();
  }, [activeTab, fetchSummary]);

  // ---- Calendario mensual ----
  const today = new Date();
  // year y month viven en un solo estado a propósito: en modo dev, StrictMode
  // invoca dos veces cualquier función de actualización pasada a setState, así
  // que un setCalendarYear() anidado *dentro* del updater de setCalendarMonth()
  // se disparaba dos veces al cruzar diciembre/enero — el año saltaba de a 2
  // (2026 -> 2028) en vez de 1. Un solo setState con un updater puro y sin
  // efectos secundarios es seguro ante esa doble invocación.
  const [calendarCursor, setCalendarCursor] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() + 1 }));
  const calendarYear = calendarCursor.year;
  const calendarMonth = calendarCursor.month; // 1-12
  const [calendarDays, setCalendarDays] = useState<CalendarDayCount[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

  const fetchCalendar = useCallback(async (year: number, month: number) => {
    setIsLoadingCalendar(true);
    try {
      const res = await tasksService.getCalendar(year, month, selectedGoalId ?? undefined) as unknown as { data: CalendarDayCount[] };
      setCalendarDays(res.data);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al cargar el calendario'));
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [error, selectedGoalId]);

  useEffect(() => {
    if (activeTab === 'activities') fetchCalendar(calendarYear, calendarMonth);
  }, [activeTab, calendarYear, calendarMonth, fetchCalendar]);

  const goToPrevMonth = () => {
    setCalendarCursor(({ year, month }) => (month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }));
  };
  const goToNextMonth = () => {
    setCalendarCursor(({ year, month }) => (month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }));
  };

  // ---- Usuarios (Trabajadores) ----
  const [users, setUsers] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosClient.get('/users');
        setUsers(res.data);
      } catch (e) {
        console.error('Error fetching users', e);
      }
    };
    fetchUsers();
  }, []);

  // ---- Acciones compartidas de actualización de datos ----
  const refreshCurrentView = useCallback(() => {
    fetchTasks(currentPage);
    fetchSummary();
    fetchCalendar(calendarYear, calendarMonth);
  }, [fetchTasks, currentPage, fetchSummary, fetchCalendar, calendarYear, calendarMonth]);

  // ---- Modal: Crear actividad (chooser Plantilla / Libre) ----
  const [createMode, setCreateMode] = useState<'choosing' | 'template' | 'free' | null>(null);
  const [templateForm, setTemplateForm] = useState<TaskTemplateCreateInput>(EMPTY_TEMPLATE_FORM);
  const [freeForm, setFreeForm] = useState<TaskCreateInput>(EMPTY_FREE_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const openCreateChooser = () => setCreateMode('choosing');
  const chooseCreateMode = (mode: 'template' | 'free') => {
    setTemplateForm(EMPTY_TEMPLATE_FORM);
    setFreeForm(EMPTY_FREE_FORM);
    setCreateMode(mode);
  };
  const closeCreate = () => setCreateMode(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await tasksService.createTask(createMode === 'template' ? templateForm : freeForm);
      success('Actividad creada correctamente');
      refreshCurrentView();
      setCreateMode(null);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al crear la actividad'));
    } finally {
      setIsSaving(false);
    }
  };

  const [editingTask, setEditingTask] = useState<OperationalTask | undefined>(undefined);
  const [editForm, setEditForm] = useState<TaskUpdateInput>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEdit = (task: OperationalTask) => {
    setEditingTask(task);
    const existingResources: { type: 'tool' | 'supply'; id: number }[] = (task.resources || []).map(r => ({ type: r.resource_type, id: r.resource_id }));
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      observations: task.observations ?? '',
      assigned_to: task.assigned_to,
      priority: task.priority,
      planned_date: task.planned_date?.split('T')[0] ?? '',
      resources: existingResources,
    });
  };
  const closeEdit = () => { setEditingTask(undefined); setEditForm({}); };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsSavingEdit(true);
    try {
      await tasksService.updateTask(editingTask.id, editForm);
      success('Actividad actualizada correctamente');
      refreshCurrentView();
      closeEdit();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al actualizar la actividad'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ---- Completar tarea ----
  // La actividad de Despacho tiene un flujo especial de doble confirmación: la
  // cantidad sale sola de los movimientos de salida ya registrados en
  // Seguimiento para el ciclo del lote (nunca se escribe a mano acá) — ver
  // paso 1 (dispatchPreview) y paso 2 (dispatchStep === 'confirm').
  const [completingTask, setCompletingTask] = useState<OperationalTask | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [dispatchPreview, setDispatchPreview] = useState<DispatchPreview | null>(null);
  const [isLoadingDispatchPreview, setIsLoadingDispatchPreview] = useState(false);
  const [dispatchStep, setDispatchStep] = useState<'preview' | 'confirm'>('preview');

  const isDispatchTask = (task: OperationalTask) => task.activity_type?.system_code === 'DISPATCH' && !!task.lot_cycle_phase_id;

  const openComplete = async (task: OperationalTask) => {
    setCompletingTask(task);
    setDispatchPreview(null);
    setDispatchStep('preview');

    if (isDispatchTask(task)) {
      setIsLoadingDispatchPreview(true);
      try {
        const res = await tasksService.getDispatchPreview(task.id) as unknown as { data: DispatchPreview };
        setDispatchPreview(res.data);
      } catch (err) {
        error(extractErrorMessage(err, 'Error al calcular la cantidad despachada'));
        setCompletingTask(null);
      } finally {
        setIsLoadingDispatchPreview(false);
      }
    }
  };
  const closeComplete = () => {
    setCompletingTask(null);
    setDispatchPreview(null);
    setDispatchStep('preview');
  };
  const continueDispatchConfirm = () => setDispatchStep('confirm');
  const backToDispatchPreview = () => setDispatchStep('preview');

  const handleComplete = async () => {
    if (!completingTask || !user) return;
    setIsCompleting(true);
    try {
      await tasksService.completeTask(completingTask.id, user.id);
      success('Actividad marcada como realizada');
      refreshCurrentView();
      closeComplete();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al completar la actividad'));
    } finally {
      setIsCompleting(false);
    }
  };

  // ---- Eliminar tarea ----
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDelete = (taskId: number) => setDeletingTaskId(taskId);
  const closeDelete = () => setDeletingTaskId(null);

  const handleDelete = async () => {
    if (!deletingTaskId) return;
    setIsDeleting(true);
    try {
      await tasksService.deleteTask(deletingTaskId);
      success('Actividad eliminada');
      refreshCurrentView();
      closeDelete();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al eliminar la actividad'));
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    activeTab, setActiveTab,
    users, // Exportado para los selects

    // Selector de meta
    goals, selectedGoalId, selectGoal,

    // Actividades (lista unificada)
    tasks, isLoadingTasks, currentPage, lastPage, fetchTasks,
    search, setSearch, statusFilter, setStatusFilter, scopeFilter, setScopeFilter,

    // Cards de resumen
    summary, isLoadingSummary,

    // Calendario
    calendarYear, calendarMonth, calendarDays, isLoadingCalendar, goToPrevMonth, goToNextMonth,

    // Crear (chooser Plantilla/Libre)
    createMode, openCreateChooser, chooseCreateMode, closeCreate,
    templateForm, setTemplateForm, freeForm, setFreeForm, isSaving, handleCreate,

    // Editar
    editingTask, editForm, setEditForm, openEdit, closeEdit,
    isSavingEdit, handleSaveEdit,

    // Completar
    completingTask, isCompleting, openComplete, closeComplete, handleComplete,
    dispatchPreview, isLoadingDispatchPreview, dispatchStep, continueDispatchConfirm, backToDispatchPreview,

    // Eliminar
    deletingTaskId, isDeleting, openDelete, closeDelete, handleDelete,
  };
}
