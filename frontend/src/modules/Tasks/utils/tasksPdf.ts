import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReportQueryFilters, ReportQueryResult } from '../types';

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const SLATE_800: [number, number, number] = [30, 41, 59];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_600: [number, number, number] = [71, 85, 105];
const SLATE_200: [number, number, number] = [226, 232, 240];
const SLATE_50: [number, number, number] = [248, 250, 252];
const SLATE_900: [number, number, number] = [15, 23, 42];
const EMERALD_500: [number, number, number] = [16, 185, 129];

function periodLabel(filters: ReportQueryFilters): string {
  if (filters.day && filters.month) return `${filters.day} de ${MONTH_LABELS[filters.month - 1]} de ${filters.year}`;
  if (filters.month) return `${MONTH_LABELS[filters.month - 1]} de ${filters.year}`;
  return `Año ${filters.year}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Dibuja una dona vectorial (nada de captura de pantalla/HTML-to-canvas) con
 * primitivas de jsPDF: cada sector se aproxima con un abanico de triángulos
 * rellenos desde el centro, y se "perfora" el centro con un círculo blanco.
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

  let angle = -Math.PI / 2; // 12 en punto
  const step = (3 * Math.PI) / 180; // sectores de 3°

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

export function generateActivitiesReportPdf(filters: ReportQueryFilters, result: ReportQueryResult, viveroName?: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marginX = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...SLATE_800);
  doc.text('Reporte de Actividades', marginX, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_500);
  if (viveroName) {
    doc.text(viveroName, marginX, y);
    y += 5;
  }
  doc.text(`Período: ${periodLabel(filters)}`, marginX, y);
  y += 5;
  doc.text(`Generado el ${new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}`, marginX, y);
  y += 6;

  doc.setDrawColor(...SLATE_200);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 10;

  // Resumen + dona
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_800);
  doc.text('Resumen', marginX, y);
  y += 8;

  const statsTop = y;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_600);
  doc.text(`Total de actividades: ${result.total}`, marginX, y);
  y += 6;
  doc.text(`Realizadas: ${result.completed}`, marginX, y);
  y += 6;
  doc.text(`Pendientes: ${result.pending}`, marginX, y);

  const donutCx = pageWidth - marginX - 20;
  const donutCy = statsTop + 6;
  drawDonut(doc, donutCx, donutCy, 14, 0.55, [
    { value: result.completed, color: EMERALD_500 },
    { value: result.pending, color: SLATE_200 },
  ]);
  drawLegend(doc, donutCx - 30, donutCy + 22, [
    { label: 'Realizadas', color: EMERALD_500 },
    { label: 'Pendientes', color: SLATE_200 },
  ]);

  y += 20;

  // Tabla de actividades (cuadrícula real, no captura de pantalla)
  const rows = result.tasks.map(t => [
    t.title,
    t.status === 'completed' ? 'Realizada' : 'Pendiente',
    t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : t.priority === 'low' ? 'Baja' : '—',
    formatDate(t.planned_date),
    t.lot_id ? `Lote ${t.lot_id}` : 'General',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Actividad', 'Estado', 'Prioridad', 'Fecha planificada', 'Alcance']],
    body: rows,
    theme: 'grid',
    margin: { left: marginX, right: marginX },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: SLATE_600,
      lineColor: SLATE_200,
      lineWidth: 0.15,
      cellPadding: 3,
    },
    headStyles: { fillColor: SLATE_900, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: SLATE_50 },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_500);
      doc.text(`Página ${data.pageNumber}`, pageWidth - marginX, pageHeight - 10, { align: 'right' });
    },
  });

  const suffix = [filters.year, filters.month, filters.day].filter(Boolean).join('-');
  doc.save(`reporte_actividades_${suffix}.pdf`);
}
