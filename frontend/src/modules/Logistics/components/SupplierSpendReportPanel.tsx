import React, { useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAuth } from '../../../shared/context/AuthContext';
import { useSupplierSpendReportViewModel } from '../viewmodels/useSupplierSpendReportViewModel';
import type { SupplierSpend } from '../types';

/**
 * Reporte de Proveedores: cuántos hay registrados y cuánto se le ha comprado a cada
 * uno históricamente. Distinto del reporte de Compras (que se muestra en la pestaña
 * Compras y está acotado a la Meta de Producción actual) — ver
 * docs/03_MODULE_CONTRACTS/Logistics.md §7.
 */
export const SupplierSpendReportPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const { summary, isLoading } = useSupplierSpendReportViewModel();
  const [detailSupplier, setDetailSupplier] = useState<SupplierSpend | null>(null);

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

          {/* Desktop: tabla completa (lg+) */}
          <div className="hidden lg:block max-h-[560px] overflow-x-auto overflow-y-auto rounded-lg border border-slate-100 max-w-[90%] mx-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="sticky top-0 z-10 bg-slate-50">
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

          {/* Mobile: solo Proveedor/Total Gastado, el resto vive en el detalle (lg:hidden) */}
          <div className="lg:hidden max-h-[560px] overflow-x-auto overflow-y-auto rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Gastado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.suppliers.map(supplier => (
                  <tr key={supplier.supplier_id} onClick={() => setDetailSupplier(supplier)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-3 py-2 text-sm text-slate-700">{supplier.supplier_name}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">${Number(supplier.total_spent).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalle del proveedor (mobile) — info completa al seleccionar una fila */}
      <Modal isOpen={!!detailSupplier} onClose={() => setDetailSupplier(null)} title={detailSupplier?.supplier_name ?? ''}>
        {detailSupplier && (
          <div className="p-6 space-y-4">
            <Badge variant={detailSupplier.status === 'active' ? 'success' : 'neutral'}>
              {detailSupplier.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5"># Órdenes</dt>
                <dd className="text-slate-700">{detailSupplier.orders_count}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Total Gastado</dt>
                <dd className="text-slate-700">${Number(detailSupplier.total_spent).toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
};
