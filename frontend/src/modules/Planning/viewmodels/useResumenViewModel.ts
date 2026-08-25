import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { planningService } from '../services/planningService';
import type { Lote, ViveroSummary } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const GOAL_FORM_DEFAULTS = { title: '', description: '', target_seedlings: 1000 };

export function useResumenViewModel(viveroId: number) {
  const [summary, setSummary] = useState<ViveroSummary | undefined>(undefined);
  const [lots, setLots] = useState<Lote[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { success, error } = useToast();

  const fetchSummary = async (year: number) => {
    setIsLoadingSummary(true);
    try {
      const [resSummary, resLots] = await Promise.all([
        planningService.getViveroSummary(viveroId, year),
        planningService.getLots(),
      ]);
      setSummary(resSummary.data);
      setLots((resLots.data || []).filter(l => l.vivero_id === viveroId));
    } catch (e) {
      error('Error al cargar el resumen del vivero');
      console.error(e);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedYear);
  }, [viveroId, selectedYear]);

  // ---- Crear meta (cuando el vivero seleccionado no tiene una abierta) ----
  const [goalForm, setGoalForm] = useState(GOAL_FORM_DEFAULTS);
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGoal(true);
    try {
      await planningService.createGoal({ vivero_id: viveroId, ...goalForm });
      success('Meta de producción creada');
      setGoalForm(GOAL_FORM_DEFAULTS);
      await fetchSummary(selectedYear);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo crear la meta'));
      console.error(err);
    } finally {
      setIsSavingGoal(false);
    }
  };

  // ---- Reprogramar fase ----
  const [rescheduleTarget, setRescheduleTarget] = useState<Lote | undefined>(undefined);
  const [isReschedulingSaving, setIsReschedulingSaving] = useState(false);

  const openReschedule = (lote: Lote) => setRescheduleTarget(lote);
  const closeReschedule = () => setRescheduleTarget(undefined);

  const handleConfirmReschedule = async (lotId: number, transitionDate: string) => {
    setIsReschedulingSaving(true);
    try {
      await planningService.rescheduleLotCycle(lotId, transitionDate);
      success('Calendario reprogramado');
      closeReschedule();
      await fetchSummary(selectedYear);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo reprogramar la fase'));
      console.error(err);
    } finally {
      setIsReschedulingSaving(false);
    }
  };

  return {
    summary, lots, isLoadingSummary,
    selectedYear, setSelectedYear,
    goalForm, setGoalForm, isSavingGoal, handleCreateGoal,
    rescheduleTarget, openReschedule, closeReschedule, isReschedulingSaving, handleConfirmReschedule,
  };
}
