import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { TrackingItem, TrackingMovement } from '../types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

export function useMovimientosViewModel() {
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [movements, setMovements] = useState<TrackingMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyFilterId, setHistoryFilterId] = useState<number | null>(null);

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [type, setType] = useState<'entry' | 'exit'>('entry');
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useToast();

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, movementsRes] = await Promise.all([
        trackingService.getTrackingItems(),
        trackingService.getTrackingMovements(historyFilterId ?? undefined),
      ]);
      const itemsData = itemsRes.data || [];
      setItems(itemsData);
      setMovements(movementsRes.data || []);
      setSelectedItemId(prev => prev ?? (itemsData.length > 0 ? itemsData[0].id : null));
    } catch (err) {
      error('Error al cargar los movimientos de inventario');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyFilterId]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    setIsSaving(true);
    try {
      await trackingService.createTrackingMovement({
        tracking_item_id: selectedItemId,
        type,
        quantity,
        notes: notes || undefined,
      });
      success(type === 'entry' ? 'Entrada registrada' : 'Salida registrada');
      setQuantity(0);
      setNotes('');
      await fetchAll();
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo registrar el movimiento'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    items, movements, isLoading, historyFilterId, setHistoryFilterId,
    selectedItemId, setSelectedItemId, type, setType, quantity, setQuantity,
    notes, setNotes, isSaving, handleRegister,
  };
}
