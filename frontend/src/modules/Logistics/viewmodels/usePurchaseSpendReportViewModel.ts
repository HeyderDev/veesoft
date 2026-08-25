import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { logisticsService } from '../services/logisticsService';
import { planningService } from '../../Planning/services/planningService';
import type { MetaProduccion } from '../../Planning/types';
import type { PurchaseSpendReport } from '../types';

/**
 * Reporte de gasto en compras para la Meta de Producción actual (la que sigue sin
 * culminar) del vivero activo. Logistics no define su propio concepto de "meta" —
 * reutiliza la que ya existe en Planning (ver docs/03_MODULE_CONTRACTS/Logistics.md §7).
 * El rango de fechas de la meta se resuelve aquí en el frontend (created_at →
 * finished_at o "hoy" si sigue abierta) y se le pasa al backend, que no conoce a Planning.
 */
export function usePurchaseSpendReportViewModel() {
  const { isAdmin } = useAuth();
  const [currentGoal, setCurrentGoal] = useState<MetaProduccion | null>(null);
  const [report, setReport] = useState<PurchaseSpendReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const fetchReport = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await planningService.getGoals();
      const openGoal = (response.data || []).find(goal => !goal.finished_at) ?? null;
      setCurrentGoal(openGoal);

      if (openGoal) {
        const reportResponse = await logisticsService.getPurchaseSpendReport({
          start_date: (openGoal.created_at ?? new Date().toISOString()).slice(0, 10),
          end_date: new Date().toISOString().slice(0, 10),
          label: openGoal.title,
        });
        setReport(reportResponse.data ?? null);
      } else {
        setReport(null);
      }
    } catch (err) {
      error('Error al cargar el reporte de compras');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, error]);

  useEffect(() => {
    fetchReport();

    const handleSpendUpdated = () => {
      fetchReport();
    };

    window.addEventListener('logistics:spend-updated', handleSpendUpdated);
    return () => {
      window.removeEventListener('logistics:spend-updated', handleSpendUpdated);
    };
  }, [fetchReport]);

  return { currentGoal, report, isLoading, refetch: fetchReport };
}
