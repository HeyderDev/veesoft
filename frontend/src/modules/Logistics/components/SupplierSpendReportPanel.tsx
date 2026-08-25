import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAuth } from '../../../shared/context/AuthContext';
import { useSupplierSpendReportViewModel } from '../viewmodels/useSupplierSpendReportViewModel';

/**
 * Reporte de Proveedores: cuántos hay registrados y cuánto se le ha comprado a cada
 * uno históricamente. Distinto del reporte de Compras (que se muestra en la pestaña
 * Compras y está acotado a la Meta de Producción actual) — ver
 * docs/03_MODULE_CONTRACTS/Logistics.md §7.
 */
export const SupplierSpendReportPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const { summary, isLoading } = useSupplierSpendReportViewModel();

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Reporte de Proveedores</h3>
        <p className="text-xs text-slate-500 mt-0.5">Cuántos hay y cuánto se les ha comprado en total</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : !summary || summary.total_suppliers === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">Aún no hay proveedores registrados.</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 max-w-xs">
            <p className="text-xs text-slate-500">Proveedores registrados</p>
            <p className="text-xl font-bold text-slate-800">{summary.total_suppliers}</p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"># Órdenes</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Gastado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.suppliers.map(supplier => (
                  <tr key={supplier.supplier_id}>
                    <td className="px-3 py-2 text-sm text-slate-700">{supplier.supplier_name}</td>
                    <td className="px-3 py-2">
                      <Badge variant={supplier.status === 'active' ? 'success' : 'neutral'}>
                        {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-500">{supplier.orders_count}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">${Number(supplier.total_spent).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
