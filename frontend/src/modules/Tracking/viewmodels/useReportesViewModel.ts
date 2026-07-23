import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { PendingDispatch } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

/**
 * Cierres de ciclo (Terminar Despacho en Planning) quedan aquí como "pendientes"
 * hasta que alguien reporta cuánto se despachó realmente. Ese reporte es el único
 * que crea el registro oficial que alimenta Resumen Operativo.
 */
export function useReportesViewModel(viveroId: number) {
  const [pending, setPending] = useState<PendingDispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const { success, error } = useToast();

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await trackingService.getPendingDispatches(viveroId);
      const data = res.data || [];
      setPending(data);
      setQuantities(prev => {
        const next = { ...prev };
        data.forEach(p => {
          if (next[p.id] === undefined) next[p.id] = p.lot.total_capacity;
        });
        return next;
      });
    } catch (e) {
      error('Error al cargar los despachos pendientes de reportar');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [viveroId]);

  const setQuantityFor = (lotCycleId: number, quantity: number) =>
    setQuantities(prev => ({ ...prev, [lotCycleId]: quantity }));

  const submitReport = async (lotCycleId: number) => {
    setSubmittingId(lotCycleId);
    try {
      await trackingService.createDispatchReport(lotCycleId, quantities[lotCycleId] ?? 0);
      success('Despacho reportado');
      await fetchPending();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo reportar el despacho'));
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  return { pending, isLoading, quantities, setQuantityFor, submittingId, submitReport };
}
