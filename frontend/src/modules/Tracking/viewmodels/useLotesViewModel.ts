import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { TrackingLot, TrackingProductionSummary } from '../types';

export function useLotesViewModel() {
  const [lots, setLots] = useState<TrackingLot[]>([]);
  const [summary, setSummary] = useState<TrackingProductionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enteredLotId, setEnteredLotId] = useState<number | null>(null);
  const [qrLot, setQrLot] = useState<TrackingLot | null>(null);
  const { error } = useToast();

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const [lotsRes, summaryRes] = await Promise.all([
        trackingService.getLots(),
        trackingService.getProductionSummary(),
      ]);
      setLots(lotsRes.data || []);
      setSummary(summaryRes.data || null);
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

  return { lots, summary, isLoading, enteredLotId, setEnteredLotId, qrLot, setQrLot, refetchLots: fetchLots };
}
