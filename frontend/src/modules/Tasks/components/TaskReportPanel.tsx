import React, { useEffect, useState } from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { tasksService } from '../services/tasksService';
import type { TaskReport } from '../types';

export const TaskReportPanel: React.FC = () => {
  const [report, setReport] = useState<TaskReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await tasksService.getReport() as unknown as { data: TaskReport };
        setReport(res.data);
      } catch {
        console.error('Error al cargar reporte');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!report) {
    return <p className="text-sm text-slate-500">No se pudo cargar el reporte.</p>;
  }

  const cards = [
    { label: 'Total Registradas', value: report.total, icon: '📋', bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' },
    { label: 'Pendientes', value: report.pending, icon: '⏳', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    { label: 'Completadas', value: report.completed, icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards de estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl border ${c.border} p-5`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className={`text-3xl font-bold ${c.text}`}>{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla de actividades por lote */}
      {report.by_lot.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Actividades por Lote</h3>
            <p className="text-xs text-slate-500 mt-0.5">Desglose de actividades registradas para cada lote</p>
          </div>
          <div className="p-4 space-y-3">
            {report.by_lot.map((lot) => (
              <div key={lot.lot_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                    {lot.lot_code}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Lote {lot.lot_code}</h4>
                    <p className="text-sm text-slate-500">{lot.total} actividades en total</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <span title="Pendientes" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">{lot.pending}</span>
                  <span title="Completadas" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">{lot.completed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.by_lot.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">No hay actividades registradas en lotes aún.</p>
        </div>
      )}
    </div>
  );
};
