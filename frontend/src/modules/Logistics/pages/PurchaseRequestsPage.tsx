import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { SlideOver } from '../../../components/ui/SlideOver';
import { usePurchaseRequestsViewModel } from '../viewmodels/usePurchaseRequestsViewModel';
import type { PurchaseRequestStatus } from '../types';

const statusLabels: Record<PurchaseRequestStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const statusVariants: Record<PurchaseRequestStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export const PurchaseRequestsPage: React.FC = () => {
  const {
    requests, suppliers, isLoading,
    isFormOpen, openCreate, closeForm, reason, setReason, items, addItemRow, removeItemRow, updateItemRow, isSaving, handleSave,
    reviewTarget, openReview, closeReview, reviewForm, setReviewForm, setUnitPrice, isReviewing, handleApprove, handleReject,
  } = usePurchaseRequestsViewModel();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Solicitudes de Aprovisionamiento</h1>
          <p className="text-sm text-slate-500 mt-1">Pide insumos y conviértelos en una orden de compra al aprobar</p>
        </div>
        <Button onClick={openCreate}>+ Nueva Solicitud</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-500">Aún no hay solicitudes de aprovisionamiento.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítems</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Orden generada</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map(request => (
                <tr key={request.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{request.reason}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{request.items?.length ?? 0} ítem(s)</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariants[request.status]}>{statusLabels[request.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{request.purchase_order?.order_number ?? '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {request.status === 'pending' && (
                      <Button variant="ghost" onClick={() => openReview(request)}>Revisar</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlideOver isOpen={isFormOpen} onClose={closeForm} title="Nueva Solicitud de Aprovisionamiento">
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Motivo *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm resize-none"
              placeholder="Ej: Stock bajo de fungicida detectado en Inventario"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-600">Ítems *</label>
              <button type="button" onClick={addItemRow} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                + Agregar ítem
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Nombre *"
                      value={item.item_name}
                      onChange={e => updateItemRow(index, { item_name: e.target.value })}
                      required
                      className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                    <input
                      placeholder="SKU (código único, automático si se deja vacío)"
                      title="SKU: código único del ítem para identificarlo en el inventario. Si lo dejas vacío, se genera automáticamente."
                      value={item.item_sku}
                      onChange={e => updateItemRow(index, { item_sku: e.target.value })}
                      className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Unidad *"
                      value={item.unit}
                      onChange={e => updateItemRow(index, { unit: e.target.value })}
                      required
                      className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      placeholder="Cantidad"
                      value={item.quantity}
                      onChange={e => updateItemRow(index, { quantity: Number(e.target.value) })}
                      required
                      className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Quitar ítem
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" isLoading={isSaving} className="w-full">Registrar Solicitud</Button>
        </form>
      </SlideOver>

      <SlideOver
        isOpen={!!reviewTarget}
        onClose={closeReview}
        title="Revisar Solicitud"
        subtitle={reviewTarget?.reason}
      >
        {reviewTarget && (
          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs text-slate-500 mb-2">
                La solicitud no trae precio: ingresa aquí cuánto cobra el proveedor que elijas abajo por cada unidad
                (kilo, unidad, litro, etc., según lo indicado por cada ítem) para calcular el total de la orden.
              </p>
              <div className="space-y-2">
                {(reviewTarget.items ?? []).map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg p-2">
                    <div className="text-sm">
                      <p className="font-medium text-slate-700">{item.item_name}</p>
                      <p className="text-xs text-slate-400">{item.quantity} {item.unit}</p>
                    </div>
                    <div className="text-right">
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                        Precio por {item.unit || 'unidad'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={reviewForm.unit_prices[item.id] ?? 0}
                        onChange={e => setUnitPrice(item.id, Number(e.target.value))}
                        className="w-24 px-2 py-1.5 border border-slate-300 rounded text-sm text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-3">
                <span className="text-sm font-medium text-slate-600">Total estimado de la orden</span>
                <span className="text-lg font-bold text-slate-800">
                  ${(reviewTarget.items ?? []).reduce((sum, item) => sum + Number(item.quantity) * (reviewForm.unit_prices[item.id] ?? 0), 0).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleApprove} className="space-y-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Aprobar y generar orden</p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° de Orden</label>
                <input
                  value={reviewForm.order_number}
                  onChange={e => setReviewForm({ ...reviewForm, order_number: e.target.value })}
                  placeholder="Correlativo automático…"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Se asigna automáticamente; puedes editarlo si necesitas otro formato.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Proveedor *</label>
                <select
                  value={reviewForm.supplier_id}
                  onChange={e => setReviewForm({ ...reviewForm, supplier_id: e.target.value ? Number(e.target.value) : '' })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                >
                  <option value="">Selecciona un proveedor…</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — score {Number(s.score).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de entrega estimada</label>
                <input
                  type="date"
                  value={reviewForm.estimated_delivery_date}
                  onChange={e => setReviewForm({ ...reviewForm, estimated_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" isLoading={isReviewing} className="flex-1">Aprobar</Button>
                <Button type="button" variant="danger" isLoading={isReviewing} onClick={() => handleReject(reviewTarget)}>
                  Rechazar
                </Button>
              </div>
            </form>
          </div>
        )}
      </SlideOver>
    </div>
  );
};
