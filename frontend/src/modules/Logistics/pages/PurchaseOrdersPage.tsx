import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { SlideOver } from '../../../components/ui/SlideOver';
import { usePurchaseOrdersViewModel } from '../viewmodels/usePurchaseOrdersViewModel';
import type { DeliveryUrgency, PurchaseOrderStatus, QualityStatus, UnregisteredItem } from '../types';
import { useAuth } from '../../../shared/context/AuthContext';

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

const qualityStatusLabels: Record<QualityStatus, string> = {
  approved: 'Aprobada',
  conditional: 'Condicional',
  rejected: 'Rechazada',
};

const qualityStatusVariants: Record<QualityStatus, 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  conditional: 'warning',
  rejected: 'danger',
};

const urgencyVariants: Record<DeliveryUrgency, 'danger' | 'warning' | 'success'> = {
  red: 'danger',
  yellow: 'warning',
  green: 'success',
};

interface PurchaseOrdersPageProps {
  /** Ítem sin proveedor en catálogo: pide vincularlo desde Proveedores en lugar de abrir "Nueva Orden". */
  onRequestSupplierCatalogLink?: (item: UnregisteredItem) => void;
  /** Cambia (p.ej. un contador) para forzar un refetch — ver `usePurchaseOrdersViewModel`. */
  refreshSignal?: unknown;
}

export const PurchaseOrdersPage: React.FC<PurchaseOrdersPageProps> = ({ onRequestSupplierCatalogLink, refreshSignal }) => {
  const { isAdmin } = useAuth();
  const {
    orders, suppliers, pendingDeliveries, unregisteredItems, catalog, isLoading,
    isFormOpen, openCreate, openCreateForItem, closeForm, form, setForm, items, addItemRow, removeItemRow, updateItemRow, isSaving, handleSave,
    isReceiveOpen, receivingOrder, openReceive, closeReceive, receiveForm, setReceiveForm, isReceiving, handleReceive,
  } = usePurchaseOrdersViewModel(refreshSignal);

  const handleUnregisteredItemClick = (item: UnregisteredItem) => {
    if (item.supplier_id) {
      openCreateForItem(item);
    } else {
      onRequestSupplierCatalogLink?.(item);
    }
  };

  const total = items.reduce((sum, item) => {
    const catalogItem = catalog.find(entry => entry.item_type === item.item_type && entry.item_id === item.item_id);
    return sum + item.quantity * Number(catalogItem?.unit_price ?? 0);
  }, 0);
  const selectedSupplier = suppliers.find(s => s.id === form.supplier_id);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Órdenes de Compra</h2>
          <p className="text-sm text-slate-500 mt-1">Generación y recepción de órdenes a proveedores</p>
        </div>
        {isAdmin && <Button onClick={openCreate}>+ Nueva Orden</Button>}
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
                  <p className="text-xs text-slate-400">{delivery.quantity} {delivery.unit}</p>
                </div>
                <Badge variant={urgencyVariants[delivery.urgency]}>{delivery.estimated_delivery_date ?? 'Sin definir'}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && unregisteredItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-bold text-amber-900">Ítems sin orden de compra</h3>
          <p className="mt-1 text-xs text-amber-700">
            Insumos y herramientas del inventario que aún no están en ninguna orden. Haz clic en uno para generar su orden o vincularlo con un proveedor.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {unregisteredItems.map(item => (
              <button
                key={`${item.item_type}-${item.item_id}`}
                type="button"
                onClick={() => handleUnregisteredItemClick(item)}
                title={item.supplier_id ? 'Crear orden de compra con este ítem' : 'Vincular este ítem al catálogo de un proveedor'}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 hover:border-amber-400 transition-colors"
              >
                <span>{item.item_type === 'tool' ? '🔧' : '📦'}</span>
                {item.name}{item.sku ? ` (${item.sku})` : ''}
                {!item.supplier_id && <span className="text-amber-500">· sin proveedor</span>}
              </button>
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
                    {order.receipt && (
                      <Badge
                        variant={qualityStatusVariants[order.receipt.quality_status]}
                        title={order.receipt.observations ?? undefined}
                      >
                        Calidad: {qualityStatusLabels[order.receipt.quality_status]}
                      </Badge>
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
            {selectedSupplier && catalog.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Este proveedor aún no tiene insumos en su catálogo.</p>
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
                <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-3">
                  {(() => {
                    const selectedItem = catalog.find(entry => entry.item_type === item.item_type && entry.item_id === item.item_id);
                    const unit = selectedItem?.unit ?? 'unidad';
                    const price = Number(selectedItem?.unit_price ?? 0);

                    return <>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
                    <select
                      value={item.item_id === '' ? '' : `${item.item_type}:${item.item_id}`}
                      onChange={e => {
                        const [item_type, item_id] = e.target.value.split(':');
                        updateItemRow(index, { item_type: (item_type || 'supply') as 'supply' | 'tool', item_id: item_id ? Number(item_id) : '' });
                      }}
                      required
                      disabled={!form.supplier_id || catalog.length === 0}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                    >
                      <option value="">Selecciona un ítem…</option>
                      {catalog.map(catalogItem => (
                        <option key={`${catalogItem.item_type}-${catalogItem.item_id}`} value={`${catalogItem.item_type}:${catalogItem.item_id}`}>
                          {catalogItem.item_type === 'tool' ? 'Herramienta' : 'Insumo'} · {catalogItem.name} ({catalogItem.code}) · {catalogItem.unit}
                        </option>
                      ))}
                    </select>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
                      ${price.toFixed(2)} por {unit}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,12rem)_1fr] gap-2 items-end">
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
                    <p className="pb-2 text-xs text-slate-500">Puedes ingresar cantidades fraccionadas, por ejemplo 2,5 kg.</p>
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
