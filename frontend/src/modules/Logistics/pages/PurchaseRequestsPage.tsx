import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { SlideOver } from '../../../components/ui/SlideOver';
import { usePurchaseRequestsViewModel } from '../viewmodels/usePurchaseRequestsViewModel';
import type { PurchaseRequestStatus } from '../types';
import { useAuth } from '../../../shared/context/AuthContext';

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
  const { isAdmin } = useAuth();
  const {
    requests, suppliers, inventoryItems, isLoading,
    isFormOpen, openCreate, closeForm, reason, setReason, items, addItemRow, removeItemRow, updateItemRow, isSaving, handleSave,
    reviewTarget, openReview, closeReview, reviewForm, setReviewForm, isReviewing, handleApprove, handleReject,
  } = usePurchaseRequestsViewModel();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Solicitudes de Aprovisionamiento</h1>
          <p className="text-sm text-slate-500 mt-1">Solicita ítems del Inventario y conviértelos en una orden de compra al aprobar</p>
        </div>
        {!isAdmin && <Button onClick={openCreate}>+ Nueva Solicitud</Button>}
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
                    {isAdmin && request.status === 'pending' && (
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
                <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-3">
                  {(() => {
                    const selectedItem = inventoryItems.find(entry => entry.item_type === item.item_type && entry.item_id === item.item_id);
                    const unit = selectedItem?.unit ?? 'unidad';
                    return <>
                  <select
                    value={item.item_id === '' ? '' : `${item.item_type}:${item.item_id}`}
                    onChange={event => {
                      const [item_type, item_id] = event.target.value.split(':');
                      updateItemRow(index, { item_type: (item_type || 'supply') as 'supply' | 'tool', item_id: item_id ? Number(item_id) : '' });
                    }}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  >
                    <option value="">Selecciona un ítem del Inventario…</option>
                    {inventoryItems.map(inventoryItem => (
                      <option key={`${inventoryItem.item_type}-${inventoryItem.item_id}`} value={`${inventoryItem.item_type}:${inventoryItem.item_id}`}>
                        {inventoryItem.item_type === 'tool' ? 'Herramienta' : 'Insumo'} · {inventoryItem.name} ({inventoryItem.code}) · {inventoryItem.unit}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-1 sm:grid-cols-[12rem_1fr] gap-2 items-end">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Cantidad ({unit}) *</label>
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      placeholder={`Ej.: 2.5 ${unit}`}
                      value={item.quantity}
                      onChange={e => updateItemRow(index, { quantity: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                    <p className="pb-2 text-xs text-slate-500">La unidad se toma del catálogo de Inventario.</p>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="w-full rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Quitar este ítem
                    </button>
                  )}
                    </>;
                  })()}
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
              <p className="text-xs text-slate-500 mb-2">Al aprobar, el precio se toma del catálogo del proveedor seleccionado.</p>
              <div className="space-y-2">
                {(reviewTarget.items ?? []).map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg p-2">
                    <div className="text-sm">
                      <p className="font-medium text-slate-700">{item.item_name}</p>
                      <p className="text-xs text-slate-400">{item.quantity} {item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleApprove} className="space-y-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Aprobar y generar orden</p>
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
