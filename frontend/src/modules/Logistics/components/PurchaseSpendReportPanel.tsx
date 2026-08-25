import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../shared/context/AuthContext';
import { usePurchaseSpendReportViewModel } from '../viewmodels/usePurchaseSpendReportViewModel';
import type { PurchaseSpendReport } from '../types';

const goalStatusLabels: Record<string, string> = {
  not_started: 'Sin iniciar',
  active: 'En curso',
  completed: 'Completada',
};

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function buildReportCsv(report: PurchaseSpendReport): string {
  const lines = [
    `Reporte de Compras,${csvEscape(report.label)}`,
    `Período,${report.start_date} a ${report.end_date}`,
    `Total gastado,${report.total_spent}`,
    `Órdenes,${report.orders_count}`,
    '',
    'Proveedor,# Órdenes,Total Gastado',
    ...report.suppliers.map(s => `${csvEscape(s.supplier_name)},${s.orders_count},${s.total_spent}`),
  ];
  return lines.join('\n');
}

function downloadReportCsv(report: PurchaseSpendReport): void {
  const csv = buildReportCsv(report);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-compras-${report.label.replace(/\s+/g, '-').toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reporte de gasto en compras de la Meta de Producción actual (la que sigue sin
 * culminar) del vivero activo, reutilizado en Proveedores y en Compras — ver
 * docs/03_MODULE_CONTRACTS/Logistics.md §7. No hay selector: solo la meta en curso.
 */
export const PurchaseSpendReportPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const { currentGoal, report, isLoading } = usePurchaseSpendReportViewModel();

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Reporte de Compras</h3>
          <p className="text-xs text-slate-500 mt-0.5">Gasto total y proveedores de la meta en curso</p>
        </div>
        {report && report.orders_count > 0 && (
          <Button variant="secondary" onClick={() => downloadReportCsv(report)}>⬇ Descargar CSV</Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : !currentGoal ? (
        <p className="text-sm text-slate-500 py-4 text-center">No hay una meta de producción en curso.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{currentGoal.title}</span>
            <Badge variant={currentGoal.status === 'active' ? 'info' : 'neutral'}>
              {goalStatusLabels[currentGoal.status] ?? currentGoal.status}
            </Badge>
          </div>

          {!report || report.orders_count === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No hay órdenes de compra registradas en esta meta.</p>
          ) : (
            <>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 max-w-xs">
                <p className="text-xs text-slate-500">Total gastado</p>
                <p className="text-xl font-bold text-slate-800">${Number(report.total_spent).toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{report.orders_count} orden(es) · {report.start_date} a {report.end_date}</p>
              </div>

              {report.suppliers.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-slate-100">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"># Órdenes</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Gastado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.suppliers.map(supplier => (
                        <tr key={supplier.supplier_id}>
                          <td className="px-3 py-2 text-sm text-slate-700">{supplier.supplier_name}</td>
                          <td className="px-3 py-2 text-sm text-slate-500">{supplier.orders_count}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">${Number(supplier.total_spent).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
