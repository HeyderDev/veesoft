import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { TrackingGeneralSummary, TrackingLot, TrackingLotDetail } from '../types';

type ReportMode = 'general' | 'lot';

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function useResumenSeguimientoViewModel() {
  const [mode, setMode] = useState<ReportMode>('general');
  const [lots, setLots] = useState<TrackingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  const [general, setGeneral] = useState<TrackingGeneralSummary | null>(null);
  const [lotReport, setLotReport] = useState<TrackingLotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

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
    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(16);
    doc.text('Reporte de Seguimiento — Vivero Lastenia', 14, y);
    y += 10;
    doc.setFontSize(11);

    if (mode === 'general' && general) {
      doc.text(`Total de lotes: ${general.total_lots}`, 14, y);
      y += 7;
      doc.text(`Total de plántulas despachadas: ${general.total_dispatched}`, 14, y);
      y += 10;
      doc.setFontSize(13);
      doc.text('Clientes con más plántulas recibidas', 14, y);
      y += 8;
      doc.setFontSize(11);
      if (general.top_clients.length === 0) {
        doc.text('Sin salidas registradas todavía.', 14, y);
      } else {
        general.top_clients.forEach(c => {
          doc.text(`${c.name}: ${c.total_quantity} plántulas`, 14, y);
          y += 7;
        });
      }
    } else if (mode === 'lot' && lotReport) {
      doc.text(`Lote: ${lotReport.lot.name} (${lotReport.lot.code})`, 14, y);
      y += 7;
      doc.text(`Capacidad: ${lotReport.lot.total_capacity}`, 14, y);
      y += 10;
      doc.setFontSize(13);
      doc.text('Historial de salidas', 14, y);
      y += 8;
      doc.setFontSize(11);
      if (lotReport.movements.data.length === 0) {
        doc.text('Sin salidas registradas todavía.', 14, y);
      } else {
        lotReport.movements.data.forEach(m => {
          doc.text(
            `${formatDate(m.movement_date)} — ${m.tracking_client?.name ?? 'Cliente eliminado'}: ${m.quantity}`,
            14, y,
          );
          y += 7;
        });
      }
    }

    doc.save('reporte_seguimiento_vivero_lastenia.pdf');
  };

  return {
    mode, setMode, lots, selectedLotId, setSelectedLotId,
    general, lotReport, isLoading, exportPdf,
  };
}
