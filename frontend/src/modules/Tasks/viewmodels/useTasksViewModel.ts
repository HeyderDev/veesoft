import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { tasksService } from '../services/tasksService';
import axiosClient from '../../../shared/services/axiosClient';
import type { OperationalTask, TaskCreateInput, TaskUpdateInput } from '../types';

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

const EMPTY_CREATE_FORM: TaskCreateInput = {
  title: '',
  description: '',
  observations: '',
  planned_date: new Date().toISOString().split('T')[0],
  priority: 'medium',
  lot_id: null,
  assigned_to: null,
  resources: []
};

export type TaskTab = 'general' | 'lot' | 'history' | 'report';

export function useTasksViewModel() {
  const { success, error } = useToast();
  
  // ---- Pestañas ----
  const [activeTab, setActiveTab] = useState<TaskTab>('general');

  // ---- Tareas Generales (paginadas) ----
  const [generalTasks, setGeneralTasks] = useState<OperationalTask[]>([]);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [statusFilterGeneral, setStatusFilterGeneral] = useState<'all' | 'pending' | 'completed'>('all');

  const fetchGeneralTasks = useCallback(async (page = 1) => {
    setIsLoadingGeneral(true);
    try {
      const res = await tasksService.getTasks(page) as unknown as { data: OperationalTask[]; meta: { current_page: number; last_page: number } };
      setGeneralTasks(res.data);
      setCurrentPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al cargar las tareas generales'));
      console.error(err);
    } finally {
      setIsLoadingGeneral(false);
    }
  }, [error]);

  useEffect(() => {
    if (activeTab === 'general') {
      fetchGeneralTasks(1);
    }
  }, [fetchGeneralTasks, activeTab]);

  const filteredGeneralTasks = statusFilterGeneral === 'all'
    ? generalTasks
    : generalTasks.filter(t => t.status === statusFilterGeneral);

  // ---- Tareas por Lote ----
  const [lotTasks, setLotTasks] = useState<OperationalTask[]>([]);
  const [isLoadingLot, setIsLoadingLot] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  const fetchLotTasks = useCallback(async (lotId: number) => {
    setIsLoadingLot(true);
    try {
      const res = await tasksService.getTasksByLot(lotId) as unknown as { data: OperationalTask[] };
      setLotTasks(res.data);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al cargar tareas del lote'));
    } finally {
      setIsLoadingLot(false);
    }
  }, [error]);

  useEffect(() => {
    if (activeTab === 'lot' && selectedLotId) {
      fetchLotTasks(selectedLotId);
    }
  }, [activeTab, selectedLotId, fetchLotTasks]);

  // ---- Historial ----
  const [historyTasks, setHistoryTasks] = useState<OperationalTask[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState<'all' | 'general' | 'lot'>('all');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const filters: any = {};
      if (historyFilterType !== 'all') filters.type = historyFilterType;
      if (historyFilterStatus !== 'all') filters.status = historyFilterStatus;
      
      const res = await tasksService.getHistory(filters) as unknown as { data: OperationalTask[] };
      setHistoryTasks(res.data);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al cargar historial'));
    } finally {
      setIsLoadingHistory(false);
    }
  }, [error, historyFilterType, historyFilterStatus]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);
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
    if (activeTab === 'general') fetchGeneralTasks(currentPage);
    if (activeTab === 'lot' && selectedLotId) fetchLotTasks(selectedLotId);
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, currentPage, selectedLotId, fetchGeneralTasks, fetchLotTasks, fetchHistory]);


  // ---- Modal: Crear tarea ----
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TaskCreateInput>(EMPTY_CREATE_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => { 
    setCreateForm({
      ...EMPTY_CREATE_FORM,
      // Si estamos en la pestaña de lotes y hay un lote seleccionado, podríamos preseleccionar (requeriría saber la fase activa, pero por ahora solo abrimos el form)
    }); 
    setIsCreateOpen(true); 
  };
  const closeCreate = () => setIsCreateOpen(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await tasksService.createTask(createForm);
      success('Tarea creada correctamente');
      refreshCurrentView();
      setIsCreateOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al crear la tarea'));
      console.error(err);
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
      success('Tarea actualizada correctamente');
      refreshCurrentView();
      closeEdit();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al actualizar la tarea'));
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ---- Completar tarea ----
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const openComplete = (taskId: number) => {
    setCompletingTaskId(taskId);
  };
  const closeComplete = () => {
    setCompletingTaskId(null);
  };

  const handleComplete = async () => {
    if (!completingTaskId) return;
    setIsCompleting(true);
    try {
      await tasksService.completeTask(completingTaskId, 1); // User ID 1 for now
      success('Tarea marcada como completada');
      refreshCurrentView();
      closeComplete();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al completar la tarea'));
      console.error(err);
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
      success('Tarea eliminada');
      refreshCurrentView();
      closeDelete();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al eliminar la tarea'));
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    activeTab, setActiveTab,
    users, // Exportado para los selects
    
    // Generales
    generalTasks: filteredGeneralTasks, isLoadingGeneral, currentPage, lastPage,
    fetchGeneralTasks,
    statusFilterGeneral, setStatusFilterGeneral,
    
    // Por lote
    lotTasks, isLoadingLot, selectedLotId, setSelectedLotId,
    
    // Historial
    historyTasks, isLoadingHistory, 
    historyFilterType, setHistoryFilterType, 
    historyFilterStatus, setHistoryFilterStatus,

    // Crear
    isCreateOpen, openCreate, closeCreate,
    createForm, setCreateForm, isSaving, handleCreate,
    
    // Editar
    editingTask, editForm, setEditForm, openEdit, closeEdit,
    isSavingEdit, handleSaveEdit,
    
    // Completar
    completingTaskId, isCompleting, openComplete, closeComplete, handleComplete,
    
    // Eliminar
    deletingTaskId, isDeleting, openDelete, closeDelete, handleDelete,
  };
}
