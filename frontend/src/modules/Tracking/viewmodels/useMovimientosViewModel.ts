import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { TrackingClient, TrackingLot, TrackingMovement } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

/**
 * Escenario de un lote específico: registrar salidas (siempre con cliente) y
 * ver su historial — no hay entradas, los lotes se crean en Planning.
 */
export function useMovimientosViewModel(lotId: number) {
  const [lot, setLot] = useState<TrackingLot | null>(null);
  const [movements, setMovements] = useState<TrackingMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [client, setClient] = useState<TrackingClient | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useToast();

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await trackingService.getLotDetail(lotId);
      setLot(res.data?.lot ?? null);
      setMovements(res.data?.movements?.data ?? []);
    } catch (err) {
      error('Error al cargar el historial del lote');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!client) {
      error('Selecciona un cliente para registrar la salida');
      return;
    }

    setIsSaving(true);
    try {
      await trackingService.createMovement({
        lot_id: lotId,
        tracking_client_id: client.id,
        quantity,
        notes: notes || undefined,
      });
      success('Salida registrada');
      setClient(null);
      setQuantity(0);
      setNotes('');
      await fetchDetail();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo registrar la salida'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    lot, movements, isLoading, client, setClient, quantity, setQuantity,
    notes, setNotes, isSaving, handleRegister,
  };
}
