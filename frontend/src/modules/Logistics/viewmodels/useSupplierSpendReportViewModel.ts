import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { logisticsService } from '../services/logisticsService';
import type { SupplierSpendSummary } from '../types';

/**
 * Reporte de Proveedores: cuántos hay registrados y cuánto se le ha comprado a cada
 * uno históricamente (`GET /suppliers-spend-summary`, `role:Admin`).
 */
export function useSupplierSpendReportViewModel() {
  const { isAdmin } = useAuth();
  const [summary, setSummary] = useState<SupplierSpendSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const fetchSummary = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await logisticsService.getSupplierSpendSummary();
      setSummary(response.data ?? null);
    } catch (err) {
      error('Error al cargar el reporte de proveedores');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, error]);

  useEffect(() => {
    fetchSummary();

    const handleSpendUpdated = () => {
      fetchSummary();
    };

    window.addEventListener('logistics:spend-updated', handleSpendUpdated);
    return () => {
      window.removeEventListener('logistics:spend-updated', handleSpendUpdated);
    };
  }, [fetchSummary]);

  return { summary, isLoading, refetch: fetchSummary };
}
