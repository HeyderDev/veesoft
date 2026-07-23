import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { planningService } from '../services/planningService';
import type { Fase, Lote, LotCreateInput } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const CREATE_FORM_DEFAULTS: LotCreateInput = {
  name: '',
  width: 5,
  length: 5,
  funda_diameter: 12,
  corridor_count: 0,
  corridor_width: 0,
  notes: '',
};

export function useLotesViewModel(viveroId: number) {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [fases, setFases] = useState<Fase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [resLotes, resFases] = await Promise.all([
        planningService.getLots(),
        planningService.getPhases(),
      ]);
      setLotes((resLotes.data || []).filter(l => l.vivero_id === viveroId));
      setFases((resFases.data || []).filter(f => f.vivero_id === viveroId));
    } catch (e) {
      error('Error al cargar los lotes');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [viveroId]);

  // ---- Crear lote ----
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<LotCreateInput>(CREATE_FORM_DEFAULTS);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setCreateForm({ ...CREATE_FORM_DEFAULTS, vivero_id: viveroId });
    setIsCreateOpen(true);
  };
  const closeCreate = () => setIsCreateOpen(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await planningService.createLot({ ...createForm, vivero_id: viveroId });
      success('Lote creado correctamente');
      await fetchAll();
      setIsCreateOpen(false);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al crear el lote'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Detalle / ajustes de un lote existente ----
  const [selectedLot, setSelectedLot] = useState<Lote | undefined>(undefined);
  const [editForm, setEditForm] = useState<{ name: string; notes: string }>({ name: '', notes: '' });
  const [capacityInput, setCapacityInput] = useState<number>(0);
  const [isSavingDetail, setIsSavingDetail] = useState(false);

  const [cycleStartDate, setCycleStartDate] = useState(today());
  const [startingPhaseId, setStartingPhaseId] = useState<number | undefined>(undefined);

  const openDetail = (lote: Lote) => {
    setSelectedLot(lote);
    setEditForm({ name: lote.name, notes: lote.notes || '' });
    setCapacityInput(lote.total_capacity);
    setCycleStartDate(today());
    setStartingPhaseId(fases[0]?.id);
  };
  const closeDetail = () => setSelectedLot(undefined);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;
    setIsSavingDetail(true);
    try {
      await planningService.updateLot(selectedLot.id, editForm);
      success('Lote actualizado correctamente');
      await fetchAll();
      closeDetail();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al actualizar el lote'));
      console.error(err);
    } finally {
      setIsSavingDetail(false);
    }
  };

  const handleUpdateCapacity = async () => {
    if (!selectedLot) return;
    setIsSavingDetail(true);
    try {
      await planningService.updateLotCapacity(selectedLot.id, capacityInput);
      success('Capacidad corregida correctamente');
      await fetchAll();
      closeDetail();
    } catch (err) {
      error(extractErrorMessage(err, 'La corrección debe estar dentro del margen permitido'));
      console.error(err);
    } finally {
      setIsSavingDetail(false);
    }
  };

  const handleSetInactive = async () => {
    if (!selectedLot) return;
    try {
      await planningService.updateLotStatus(selectedLot.id, 'inactive');
      success('Lote marcado como inactivo');
      await fetchAll();
      closeDetail();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo inactivar el lote'));
      console.error(err);
    }
  };

  const handleSetAvailable = async () => {
    if (!selectedLot) return;
    try {
      await planningService.updateLotStatus(selectedLot.id, 'available');
      success('Lote marcado como disponible');
      await fetchAll();
      closeDetail();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo reactivar el lote'));
      console.error(err);
    }
  };

  const handleDeleteLot = async () => {
    if (!selectedLot) return;
    try {
      await planningService.deleteLot(selectedLot.id);
      success('Lote eliminado');
      await fetchAll();
      closeDetail();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo eliminar el lote'));
      console.error(err);
    }
  };

  // ---- Ciclo productivo: Comenzar Ciclo / Terminar Despacho ----
  const [isStartingCycle, setIsStartingCycle] = useState(false);

  const handleStartCycle = async () => {
    if (!selectedLot) return;
    setIsStartingCycle(true);
    try {
      await planningService.startLotCycle(selectedLot.id, cycleStartDate, startingPhaseId);
      success('Ciclo iniciado — calendario calculado');
      await fetchAll();
      closeDetail();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo comenzar el ciclo'));
      console.error(err);
    } finally {
      setIsStartingCycle(false);
    }
  };

  const handleTerminateDispatch = async () => {
    if (!selectedLot) return;
    setIsStartingCycle(true);
    try {
      await planningService.terminateDispatch(selectedLot.id);
      success('Ciclo cerrado — el lote vuelve a estar disponible. Reporta la cantidad real despachada desde Reportes.');
      await fetchAll();
      closeDetail();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo cerrar el ciclo'));
      console.error(err);
    } finally {
      setIsStartingCycle(false);
    }
  };

  // ---- Posición libre en el workspace (metros) ----
  const handleDragEnd = async (loteId: number, x: number, y: number) => {
    const roundedX = Math.round(x * 100) / 100;
    const roundedY = Math.round(y * 100) / 100;
    setLotes(prev => prev.map(l => (l.id === loteId ? { ...l, position_x: String(roundedX), position_y: String(roundedY) } : l)));
    try {
      await planningService.updateLotPosition(loteId, roundedX, roundedY);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    lotes, fases, isLoading,
    isCreateOpen, openCreate, closeCreate, createForm, setCreateForm, isSaving, handleCreate,
    selectedLot, openDetail, closeDetail,
    editForm, setEditForm, capacityInput, setCapacityInput, isSavingDetail,
    handleSaveEdit, handleUpdateCapacity, handleSetInactive, handleSetAvailable, handleDeleteLot,
    handleDragEnd,
    cycleStartDate, setCycleStartDate, startingPhaseId, setStartingPhaseId,
    isStartingCycle, handleStartCycle, handleTerminateDispatch,
  };
}
