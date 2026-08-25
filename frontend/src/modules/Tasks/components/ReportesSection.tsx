import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { tasksService } from '../services/tasksService';
import { generateActivitiesReportPdf } from '../utils/tasksPdf';
import type { ReportQueryResult } from '../types';

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as any).response?.data?.message;
    if (message) return message;
  }
  return fallback;
}

export const ReportesSection: React.FC = () => {
  const { error } = useToast();
  const { activeVivero } = useActiveVivero();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReportQueryResult | null>(null);

  const daysInMonth = month ? new Date(year, month, 0).getDate() : 31;

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const filters = {
        year,
        month: month || undefined,
        day: month && day ? day : undefined,
      };
      const res = await tasksService.getReportQuery(filters) as unknown as { data: ReportQueryResult };
      setResult(res.data);
    } catch (err) {
      error(extractErrorMessage(err, 'Error al generar el reporte'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    generateActivitiesReportPdf(
      { year, month: month || undefined, day: month && day ? day : undefined },
      result,
      activeVivero?.name,
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Reportes</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Filtra por período y genera un PDF con el listado y las estadísticas de actividades — el detalle solo se muestra dentro del PDF.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Año</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mes</label>
          <select
            value={month}
            onChange={e => { setMonth(e.target.value ? Number(e.target.value) : ''); setDay(''); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos los meses</option>
            {MONTH_LABELS.map((label, i) => <option key={label} value={i + 1}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Día</label>
          <select
            value={day}
            disabled={!month}
            onChange={e => setDay(e.target.value ? Number(e.target.value) : '')}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-300"
          >
            <option value="">Todos los días</option>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? 'Generando...' : 'Generar'}
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center min-h-[140px] text-center">
        {!result ? (
          <p className="text-sm text-slate-400 italic">Selecciona un período y genera el reporte para ver cuántos registros se encontraron.</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-slate-800">{result.total}</p>
            <p className="text-sm text-slate-500 mb-4">registro{result.total === 1 ? '' : 's'} encontrado{result.total === 1 ? '' : 's'}</p>
            <Button onClick={handleDownload} disabled={result.total === 0}>
              Descargar PDF
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
