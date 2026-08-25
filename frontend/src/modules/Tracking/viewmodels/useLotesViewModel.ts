import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { TrackingGoal, TrackingLot, TrackingProductionSummary } from '../types';

export function useLotesViewModel() {
  const [lots, setLots] = useState<TrackingLot[]>([]);
  const [summary, setSummary] = useState<TrackingProductionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enteredLotId, setEnteredLotId] = useState<number | null>(null);
  const [qrLot, setQrLot] = useState<TrackingLot | null>(null);
  const { error } = useToast();

  // ---- Selector de meta — arranca en null hasta que fetchGoals() resuelve
  // cuál es la meta abierta (finished_at null); a partir de ahí, tarjetas y
  // panel quedan scoped a la meta seleccionada. Mismo patrón que Actividades. ----
  const [goals, setGoals] = useState<TrackingGoal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  useEffect(() => {
    trackingService.getGoals().then(res => {
      const data = res.data || [];
      setGoals(data);
      setSelectedGoalId(prev => prev ?? data.find(g => !g.finished_at)?.id ?? null);
    }).catch(err => console.error(err));
  }, []);

  const selectGoal = (goalId: number) => setSelectedGoalId(goalId);

  const fetchLots = useCallback(async () => {
    setIsLoading(true);
    try {
      const [lotsRes, summaryRes] = await Promise.all([
        trackingService.getLots(selectedGoalId ?? undefined),
        trackingService.getProductionSummary(selectedGoalId ?? undefined),
      ]);
      setLots(lotsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      error('Error al cargar los lotes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [error, selectedGoalId]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  return {
    lots, summary, isLoading, enteredLotId, setEnteredLotId, qrLot, setQrLot, refetchLots: fetchLots,
    goals, selectedGoalId, selectGoal,
  };
}
