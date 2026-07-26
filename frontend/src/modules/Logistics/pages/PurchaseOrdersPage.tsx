import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { SlideOver } from '../../../components/ui/SlideOver';
import { usePurchaseOrdersViewModel } from '../viewmodels/usePurchaseOrdersViewModel';
import type { DeliveryUrgency, PurchaseOrderStatus } from '../types';

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  sent: 'Enviada',
  received: 'Recibida',
  cancelled: 'Cancelada',
};

const statusVariants: Record<PurchaseOrderStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  draft: 'neutral',
  issued: 'info',
  sent: 'info',
  received: 'success',
  cancelled: 'danger',
};

const urgencyVariants: Record<DeliveryUrgency, 'danger' | 'warning' | 'success'> = {
  red: 'danger',
  yellow: 'warning',
  green: 'success',
};

export const PurchaseOrdersPage: React.FC = () => {
  const {
    orders, suppliers, pendingDeliveries, isLoading,
    isFormOpen, openCreate, closeForm, form, setForm, items, addItemRow, removeItemRow, updateItemRow, isSaving, handleSave,
    isReceiveOpen, receivingOrder, openReceive, closeReceive, receiveForm, setReceiveForm, isReceiving, handleReceive,
  } = usePurchaseOrdersViewModel();

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const selectedSupplier = suppliers.find(s => s.id === form.supplier_id);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Órdenes de Compra</h1>
          <p className="text-sm text-slate-500 mt-1">Generación y recepción de órdenes a proveedores</p>
        </div>
        <Button onClick={openCreate}>+ Nueva Orden</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : pendingDeliveries.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Insumos por Llegar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingDeliveries.map((delivery, index) => (
              <div key={`${delivery.purchase_order_id}-${index}`} className="border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">{delivery.item_name}</p>
                  <p className="text-xs text-slate-500">{delivery.order_number} · {delivery.supplier_name}</p>
                  <p className="text-xs text-slate-400">Entrega: {delivery.estimated_delivery_date ?? 'sin definir'}</p>
                </div>
                <Badge variant={urgencyVariants[delivery.urgency]}>{delivery.quantity} {delivery.unit}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-500">Aún no hay órdenes de compra registradas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">N° Orden</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entrega Estimada</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{order.order_number}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{order.supplier?.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{order.estimated_delivery_date ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">${Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {(order.status === 'issued' || order.status === 'sent') && (
                      <Button variant="ghost" onClick={() => openReceive(order)}>Registrar Recepción</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlideOver isOpen={isFormOpen} onClose={closeForm} title="Nueva Orden de Compra">
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">N° de Orden</label>
            <input
              value={form.order_number}
              onChange={e => setForm({ ...form, order_number: e.target.value })}
              placeholder="Correlativo automático…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Se asigna automáticamente; puedes editarlo si necesitas otro formato.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Proveedor *</label>
            <select
              value={form.supplier_id}
              onChange={e => setForm({ ...form, supplier_id: e.target.value ? Number(e.target.value) : '' })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            >
              <option value="">Selecciona un proveedor…</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} — score {Number(s.score).toFixed(2)}</option>
              ))}
            </select>
            {selectedSupplier && Number(selectedSupplier.score) < 3 && (
              <p className="text-xs text-red-500 mt-1">⚠ Este proveedor no cumple el score mínimo (3.00) para recibir órdenes.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de entrega estimada</label>
            <input
              type="date"
              value={form.estimated_delivery_date}
              onChange={e => setForm({ ...form, estimated_delivery_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Si se deja vacío, se asume hoy + 5 días.</p>
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
                  <div className="grid grid-cols-3 gap-2 items-center">
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
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Precio Unit."
                      value={item.unit_price}
                      onChange={e => updateItemRow(index, { unit_price: Number(e.target.value) })}
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

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm font-medium text-slate-600">Total</span>
            <span className="text-lg font-bold text-slate-800">${total.toFixed(2)}</span>
          </div>

          <Button type="submit" isLoading={isSaving} className="w-full">Generar Orden</Button>
        </form>
      </SlideOver>

      <SlideOver
        isOpen={isReceiveOpen}
        onClose={closeReceive}
        title="Registrar Recepción"
        subtitle={receivingOrder?.order_number}
      >
        <form onSubmit={handleReceive} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Estado de Calidad *</label>
            <select
              value={receiveForm.quality_status}
              onChange={e => setReceiveForm({ ...receiveForm, quality_status: e.target.value as typeof receiveForm.quality_status })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            >
              <option value="approved">Aprobado</option>
              <option value="conditional">Condicional</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Temperatura del Sustrato (°C)</label>
            <input
              type="number"
              step="0.01"
              value={receiveForm.substrate_temperature}
              onChange={e => setReceiveForm({ ...receiveForm, substrate_temperature: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Óptimo 18-24°C"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Observaciones</label>
            <textarea
              value={receiveForm.observations}
              onChange={e => setReceiveForm({ ...receiveForm, observations: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm resize-none"
            />
          </div>
          <Button type="submit" isLoading={isReceiving} className="w-full">Confirmar Recepción</Button>
        </form>
      </SlideOver>
    </div>
  );
};
