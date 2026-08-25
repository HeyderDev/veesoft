import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { trackingService } from '../services/trackingService';
import { generateGeneralTrackingReportPdf, generateLotTrackingReportPdf } from '../utils/trackingPdf';
import type { TrackingGeneralSummary, TrackingLot, TrackingLotDetail } from '../types';

type ReportMode = 'general' | 'lot';

export function useResumenSeguimientoViewModel() {
  const [mode, setMode] = useState<ReportMode>('general');
  const [lots, setLots] = useState<TrackingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  const [general, setGeneral] = useState<TrackingGeneralSummary | null>(null);
  const [lotReport, setLotReport] = useState<TrackingLotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();
  const { activeVivero } = useActiveVivero();

  useEffect(() => {
    trackingService.getLots().then(res => {
      const data = res.data || [];
      setLots(data);
      setSelectedLotId(prev => prev ?? (data.length > 0 ? data[0].id : null));
    });
  }, []);

  const fetchGeneral = async () => {
    setIsLoading(true);
    try {
      const res = await trackingService.getGeneralSummary();
      setGeneral(res.data ?? null);
    } catch (err) {
      error('Error al cargar el reporte general');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLotReport = async (lotId: number) => {
    setIsLoading(true);
    try {
      const res = await trackingService.getLotSummary(lotId);
      setLotReport(res.data ?? null);
    } catch (err) {
      error('Error al cargar el reporte del lote');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'general') {
      fetchGeneral();
    } else if (selectedLotId) {
      fetchLotReport(selectedLotId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedLotId]);

  const exportPdf = () => {
    if (mode === 'general' && general) {
      generateGeneralTrackingReportPdf(general, activeVivero?.name);
    } else if (mode === 'lot' && lotReport) {
      generateLotTrackingReportPdf(lotReport, activeVivero?.name);
    }
  };

  return {
    mode, setMode, lots, selectedLotId, setSelectedLotId,
    general, lotReport, isLoading, exportPdf,
  };
}
