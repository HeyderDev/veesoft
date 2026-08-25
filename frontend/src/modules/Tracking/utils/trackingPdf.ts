import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TrackingGeneralSummary, TrackingLotDetail } from '../types';

const SLATE_800: [number, number, number] = [30, 41, 59];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_600: [number, number, number] = [71, 85, 105];
const SLATE_200: [number, number, number] = [226, 232, 240];
const SLATE_50: [number, number, number] = [248, 250, 252];
const SLATE_900: [number, number, number] = [15, 23, 42];
const EMERALD_500: [number, number, number] = [16, 185, 129];

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
}

/**
 * Mismo dibujado vectorial de dona que Tasks/utils/tasksPdf.ts (nada de
 * captura de pantalla): cada sector se aproxima con un abanico de triángulos
 * rellenos desde el centro, y se "perfora" el centro con un círculo blanco.
 * Se duplica aquí en vez de importarse desde Tasks para no crear una
 * dependencia cruzada entre módulos por un detalle puramente visual.
 */
function drawDonut(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  innerRatio: number,
  segments: { value: number; color: [number, number, number] }[],
): void {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return;

  let angle = -Math.PI / 2;
  const step = (3 * Math.PI) / 180;

  segments.forEach(segment => {
    if (segment.value <= 0) return;
    const sweep = (segment.value / total) * Math.PI * 2;
    const end = angle + sweep;
    doc.setFillColor(...segment.color);

    let a = angle;
    while (a < end) {
      const a2 = Math.min(a + step, end);
      const x1 = cx + radius * Math.cos(a);
      const y1 = cy + radius * Math.sin(a);
      const x2 = cx + radius * Math.cos(a2);
      const y2 = cy + radius * Math.sin(a2);
      doc.triangle(cx, cy, x1, y1, x2, y2, 'F');
      a = a2;
    }
    angle = end;
  });

  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, radius * innerRatio, 'F');
}

/**
 * Leyenda de colores junto a la dona: un cuadrito relleno (doc.rect) en vez
 * del glyph "■" — la fuente estándar helvetica de jsPDF no trae ese carácter
 * y lo renderiza corrompido/espaciado en los lectores de PDF.
 */
function drawLegend(doc: jsPDF, x: number, y: number, items: { label: string; color: [number, number, number] }[]): void {
  let itemY = y;
  items.forEach(item => {
    doc.setFillColor(...item.color);
    doc.rect(x, itemY - 2.5, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_500);
    doc.text(item.label, x + 5, itemY);
    itemY += 5;
  });
}

function drawHeader(doc: jsPDF, title: string, viveroName: string | undefined, marginX: number, pageWidth: number): number {
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...SLATE_800);
  doc.text(title, marginX, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_500);
  if (viveroName) {
    doc.text(viveroName, marginX, y);
    y += 5;
  }
  doc.text(`Generado el ${new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}`, marginX, y);
  y += 6;

  doc.setDrawColor(...SLATE_200);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 10;

  return y;
}

function drawFooter(doc: jsPDF, pageWidth: number, marginX: number, pageNumber: number): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_500);
  doc.text(`Página ${pageNumber}`, pageWidth - marginX, pageHeight - 10, { align: 'right' });
}

const tableStyles = {
  theme: 'grid' as const,
  styles: {
    font: 'helvetica',
    fontSize: 9,
    textColor: SLATE_600,
    lineColor: SLATE_200,
    lineWidth: 0.15,
    cellPadding: 3,
  },
  headStyles: { fillColor: SLATE_900, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
  alternateRowStyles: { fillColor: SLATE_50 },
};

export function generateGeneralTrackingReportPdf(summary: TrackingGeneralSummary, viveroName?: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marginX = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = drawHeader(doc, 'Reporte de Seguimiento — General', viveroName, marginX, pageWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_800);
  doc.text('Resumen', marginX, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_600);
  doc.text(`Lotes totales: ${summary.total_lots}`, marginX, y);
  y += 6;
  doc.text(`Plántulas despachadas: ${summary.total_dispatched}`, marginX, y);
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_800);
  doc.text('Movimientos realizados', marginX, y);
  y += 4;

  const rows = summary.movements.map(m => [
    formatDate(m.movement_date),
    m.lot?.name ?? '—',
    m.tracking_client?.name ?? 'Cliente eliminado',
    m.quantity.toLocaleString('es'),
  ]);

  autoTable(doc, {
    ...tableStyles,
    startY: y + 4,
    head: [['Fecha', 'Lote', 'Cliente', 'Cantidad']],
    body: rows.length > 0 ? rows : [['Sin salidas registradas todavía.', '', '', '']],
    margin: { left: marginX, right: marginX },
    didDrawPage: (data) => drawFooter(doc, pageWidth, marginX, data.pageNumber),
  });

  doc.save(`reporte_seguimiento_general_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function generateLotTrackingReportPdf(lotReport: TrackingLotDetail, viveroName?: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marginX = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = drawHeader(doc, `Reporte de Seguimiento — ${lotReport.lot.name}`, viveroName, marginX, pageWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_800);
  doc.text('Resumen', marginX, y);
  y += 8;

  const totalDispatched = lotReport.movements.data.reduce((sum, m) => sum + m.quantity, 0);
  const remaining = Math.max(0, lotReport.lot.total_capacity - totalDispatched);

  const statsTop = y;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_600);
  doc.text(`Código: ${lotReport.lot.code}`, marginX, y);
  y += 6;
  doc.text(`Capacidad total: ${lotReport.lot.total_capacity.toLocaleString('es')}`, marginX, y);
  y += 6;
  doc.text(`Total despachado: ${totalDispatched.toLocaleString('es')}`, marginX, y);

  const donutCx = pageWidth - marginX - 20;
  const donutCy = statsTop + 6;
  drawDonut(doc, donutCx, donutCy, 14, 0.55, [
    { value: totalDispatched, color: EMERALD_500 },
    { value: remaining, color: SLATE_200 },
  ]);
  drawLegend(doc, donutCx - 30, donutCy + 22, [
    { label: 'Despachado', color: EMERALD_500 },
    { label: 'Restante', color: SLATE_200 },
  ]);

  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_800);
  doc.text('Historial de salidas', marginX, y);
  y += 4;

  const rows = lotReport.movements.data.map(m => [
    formatDate(m.movement_date),
    m.tracking_client?.name ?? 'Cliente eliminado',
    m.quantity.toLocaleString('es'),
  ]);

  autoTable(doc, {
    ...tableStyles,
    startY: y + 4,
    head: [['Fecha', 'Cliente', 'Cantidad']],
    body: rows.length > 0 ? rows : [['Sin salidas registradas todavía.', '', '']],
    margin: { left: marginX, right: marginX },
    didDrawPage: (data) => drawFooter(doc, pageWidth, marginX, data.pageNumber),
  });

  doc.save(`reporte_seguimiento_lote_${lotReport.lot.code}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
