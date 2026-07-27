import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { useToast } from '../../../components/ui/Toast';
import { trackingService } from '../services/trackingService';
import type { TrackingItem, TrackingSummary } from '../types';

const stageLabels: Record<string, string> = {
  germination: 'Germinación',
  nursery: 'Vivero',
  transplant: 'Trasplante',
  ready_for_dispatch: 'Listo para entrega',
};

export function useResumenSeguimientoViewModel() {
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [alerts, setAlerts] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, alertsRes] = await Promise.all([
        trackingService.getTrackingSummary(),
        trackingService.getStockAlerts(),
      ]);
      setSummary(summaryRes.data ?? null);
      setAlerts(alertsRes.data || []);
    } catch (err) {
      error('Error al cargar el resumen de seguimiento');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const exportPdf = () => {
    if (!summary) return;

    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(16);
    doc.text('Reporte de Seguimiento — Vivero Lastenia', 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Total de lotes en seguimiento: ${summary.total_items}`, 14, y);
    y += 7;
    doc.text(`Total de plántulas: ${summary.total_quantity}`, 14, y);
    y += 10;

    doc.setFontSize(13);
    doc.text('Por etapa de crecimiento', 14, y);
    y += 8;
    doc.setFontSize(11);
    Object.entries(summary.by_stage).forEach(([stage, data]) => {
      doc.text(`${stageLabels[stage] ?? stage}: ${data.quantity} plántulas (${data.items_count} lotes)`, 14, y);
      y += 7;
    });

    y += 5;
    doc.setFontSize(13);
    doc.text(`Alertas de stock bajo (${alerts.length})`, 14, y);
    y += 8;
    doc.setFontSize(11);
    if (alerts.length === 0) {
      doc.text('No hay lotes por debajo del stock mínimo.', 14, y);
    } else {
      alerts.forEach(item => {
        doc.text(`${item.name} — existencia ${item.quantity} / mínimo ${item.minimum_stock} (${item.location})`, 14, y);
        y += 7;
      });
    }

    doc.save('reporte_seguimiento_vivero_lastenia.pdf');
  };

  return { summary, alerts, isLoading, exportPdf, stageLabels };
}
