import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { TrackingLot } from '../types';

export function useLotesViewModel() {
  const [lots, setLots] = useState<TrackingLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enteredLotId, setEnteredLotId] = useState<number | null>(null);
  const [qrLot, setQrLot] = useState<TrackingLot | null>(null);
  const { error } = useToast();

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const res = await trackingService.getLots();
      setLots(res.data || []);
    } catch (err) {
      error('Error al cargar los lotes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  return { lots, isLoading, enteredLotId, setEnteredLotId, qrLot, setQrLot, refetchLots: fetchLots };
}
