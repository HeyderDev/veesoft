import React, { useState } from 'react';
import { AlertTriangle, Calendar, ChevronDown, Lock, Package, Plus, ShoppingBag, Truck, Wrench } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { SlideOver } from '../../../components/ui/SlideOver';
import { PurchaseSpendReportPanel } from '../components/PurchaseSpendReportPanel';
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
}

export const PurchaseOrdersPage: React.FC<PurchaseOrdersPageProps> = ({ onRequestSupplierCatalogLink }) => {
  const { isAdmin } = useAuth();
  const {
    orders, suppliers, pendingDeliveries, visiblePendingDeliveries, loadMorePendingDeliveries,
    unregisteredItems, catalog, inventoryCatalog, isWithoutSupplier, setIsWithoutSupplier,
    isLoading, hasMoreOrders, isLoadingMoreOrders, loadMoreOrders,
    isFormOpen, openCreate, openCreateForItem, closeForm, form, setForm, items, quantityLocked, reconcilesExistingInventory,
    addItemRow, removeItemRow, updateItemRow, isSaving, handleSave,
    isReceiveOpen, receivingOrder, openReceive, closeReceive, receiveForm, setReceiveForm, isReceiving, handleReceive,
  } = usePurchaseOrdersViewModel();

  const [detailOrder, setDetailOrder] = useState<(typeof orders)[number] | null>(null);
  const handleOpenReceiveFromDetail = (order: (typeof orders)[number]) => {
    setDetailOrder(null);
    openReceive(order);
  };

  const handleUnregisteredItemClick = (item: UnregisteredItem) => {
    if (item.supplier_id) {
      openCreateForItem(item);
    } else {
      onRequestSupplierCatalogLink?.(item);
    }
  };

  const total = items.reduce((sum, item) => {
    if (isWithoutSupplier) {
      return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    }
    const catalogItem = catalog.find(entry => entry.item_type === item.item_type && entry.item_id === item.item_id);
    return sum + (Number(item.quantity) || 0) * Number(catalogItem?.unit_price ?? 0);
  }, 0);

  const selectedSupplier = suppliers.find(s => s.id === form.supplier_id);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Órdenes de Compra</h1>
          <p className="text-sm text-slate-500 mt-1">Generación, seguimiento y recepción formal de compras</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Nueva Orden</span>
          </Button>
        )}
      </div>

      {/* Ítems pendientes por llegar */}
      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : pendingDeliveries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Insumos y Herramientas por Llegar</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Mostrando {Math.min(visiblePendingDeliveries, pendingDeliveries.length)} de {pendingDeliveries.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingDeliveries.slice(0, visiblePendingDeliveries).map((delivery, index) => (
              <div key={`${delivery.purchase_order_id}-${index}`} className="border border-slate-200/70 rounded-xl p-3 flex items-start justify-between gap-2 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{delivery.item_name}</p>
                  <p className="text-xs text-slate-500 truncate">{delivery.order_number} · {delivery.supplier_name}</p>
                  <p className="text-xs font-mono font-medium text-emerald-700 mt-1">{delivery.quantity} {delivery.unit}</p>
                </div>
                <Badge variant={urgencyVariants[delivery.urgency]}>
                  {delivery.estimated_delivery_date ?? 'Sin fecha'}
                </Badge>
              </div>
            ))}
          </div>
          {pendingDeliveries.length > visiblePendingDeliveries && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={loadMorePendingDeliveries}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              >
                <span>Ver más entregas pendientes</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Aviso de ítems sin orden de compra */}
      {!isLoading && unregisteredItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm font-bold text-amber-900">Ítems ingresados a Inventario sin orden de compra</h3>
          </div>
          <p className="mt-1 text-xs text-amber-700">
            Recursos con ingreso físico que requieren respaldo documental. {isAdmin ? 'Haz clic en un ítem para generar la orden que lo regulariza:' : 'Notifica a un administrador para generar la orden correspondiente.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unregisteredItems.map(item => {
              const quantity = Number(item.quantity);
              const toolLabel = quantity === 1 || item.name.toLocaleLowerCase('es').endsWith('s')
                ? item.name
                : `${item.name}s`;
              const content = (
                <>
                  <span>{item.item_type === 'tool' ? <Wrench className="w-3.5 h-3.5 inline text-amber-600" /> : <Package className="w-3.5 h-3.5 inline text-amber-600" />}</span>
                  <span className="font-semibold text-slate-800">
                    {item.item_type === 'tool'
                      ? `${item.quantity} ${toolLabel}`
                      : `${item.name}${item.sku ? ` (${item.sku})` : ''} · ${item.quantity} ${item.unit}`}
                  </span>
                  {!item.supplier_id ? (
                    <span className="text-amber-600 font-normal">· compra local / sin proveedor</span>
                  ) : (
                    <span className="text-emerald-700 font-normal">· con proveedor sugerido</span>
                  )}
                  {item.registered_at && (
                    <span className="text-slate-400 text-[10px]">({item.registered_at})</span>
                  )}
                </>
              );

              return isAdmin ? (
                <button
                  key={`${item.item_type}-${item.item_id}`}
                  type="button"
                  onClick={() => handleUnregisteredItemClick(item)}
                  title={item.supplier_id ? 'Crear orden con proveedor para regularizar' : 'Crear compra sin proveedor / vincular'}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-medium shadow-sm hover:bg-amber-100 hover:border-amber-400 transition"
                >
                  {content}
                </button>
              ) : (
                <span key={`${item.item_type}-${item.item_id}`} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-amber-800">
                  {content}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla de órdenes */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">Aún no hay órdenes de compra registradas.</p>
        </div>
      ) : (
        <>
          {/* Desktop: tabla completa (lg+) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto overflow-y-auto max-h-[560px]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">N° Orden</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítems solicitados</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entrega Estimada</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{order.order_number}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {order.supplier?.name ?? (
                        <span className="italic text-slate-400">Sin proveedor (Compra local)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <ul className="space-y-0.5">
                        {(order.items ?? []).map(item => (
                          <li key={item.id} className="text-xs">
                            <span className="font-medium text-slate-700">{item.item_name}</span> <span className="text-slate-400">· {item.quantity} {item.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {order.estimated_delivery_date ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {order.estimated_delivery_date}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
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

          {/* Mobile: lista interactiva */}
          <div className="lg:hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto overflow-y-auto max-h-[560px]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">N° Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítems</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => (
                  <tr key={order.id} onClick={() => setDetailOrder(order)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{order.order_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="line-clamp-1">
                        {(order.items ?? []).map(i => i.item_name).join(', ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800 font-mono">
                      ${Number(order.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hasMoreOrders && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={loadMoreOrders} isLoading={isLoadingMoreOrders}>
            Cargar 20 más
          </Button>
        </div>
      )}

      {/* Detalle de la orden (mobile) */}
      <Modal isOpen={!!detailOrder} onClose={() => setDetailOrder(null)} title={detailOrder ? `Orden ${detailOrder.order_number}` : ''}>
        {detailOrder && (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariants[detailOrder.status]}>{statusLabels[detailOrder.status]}</Badge>
              {detailOrder.receipt && (
                <Badge
                  variant={qualityStatusVariants[detailOrder.receipt.quality_status]}
                  title={detailOrder.receipt.observations ?? undefined}
                >
                  Calidad: {qualityStatusLabels[detailOrder.receipt.quality_status]}
                </Badge>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Proveedor</dt>
                <dd className="text-slate-700 font-medium">{detailOrder.supplier?.name ?? 'Sin proveedor (Compra local)'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Entrega estimada</dt>
                <dd className="text-slate-700">{detailOrder.estimated_delivery_date ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-1">Ítems</dt>
                <dd className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <ul className="space-y-1 text-xs">
                    {(detailOrder.items ?? []).map(item => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.item_name} ({item.quantity} {item.unit})</span>
                        <span className="font-mono font-medium">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Total</dt>
                <dd className="text-base font-bold text-slate-800 font-mono">${Number(detailOrder.total).toFixed(2)}</dd>
              </div>
            </dl>
            {(detailOrder.status === 'issued' || detailOrder.status === 'sent') && (
              <div className="pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={() => handleOpenReceiveFromDetail(detailOrder)} className="w-full">Registrar Recepción</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <PurchaseSpendReportPanel />

      {/* SlideOver Formulario Nueva Orden */}
      <SlideOver isOpen={isFormOpen} onClose={closeForm} title="Nueva Orden de Compra">
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Selector de modo: Con proveedor vs Sin proveedor */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setIsWithoutSupplier(false); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                !isWithoutSupplier
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Proveedor Registrado
            </button>
            <button
              type="button"
              onClick={() => { setIsWithoutSupplier(true); setForm({ ...form, supplier_id: '' }); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                isWithoutSupplier
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Compra Sin Proveedor (Consumidor Final)
            </button>
          </div>

          {!isWithoutSupplier ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Proveedor *</label>
              <select
                value={form.supplier_id}
                onChange={e => setForm({ ...form, supplier_id: e.target.value ? Number(e.target.value) : '' })}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition"
              >
                <option value="">Selecciona un proveedor…</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — score {Number(s.score).toFixed(2)}</option>
                ))}
              </select>
              {selectedSupplier && Number(selectedSupplier.score) < 3 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Este proveedor tiene score bajo ({Number(selectedSupplier.score).toFixed(2)}/5.00). Puedes emitir la orden si lo consideras adecuado.
                </p>
              )}
              {selectedSupplier && catalog.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Este proveedor aún no tiene insumos en su catálogo.</p>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
              <p className="text-xs text-emerald-800">
                <strong>Compra sin proveedor registrado:</strong> Puedes seleccionar cualquier insumo o herramienta existente en tu inventario e indicar el precio unitario pactado directamente.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de entrega estimada</label>
            <input
              type="date"
              value={form.estimated_delivery_date}
              onChange={e => setForm({ ...form, estimated_delivery_date: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition"
            />
            <p className="text-xs text-slate-400 mt-1">Si se deja vacío, se asume hoy + 5 días.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">Ítems solicitados *</label>
              {!reconcilesExistingInventory && (
                <button type="button" onClick={addItemRow} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  + Agregar ítem
                </button>
              )}
            </div>
            <div className="space-y-3">
              {items.map((item, index) => {
                const isLocked = quantityLocked[index] ?? false;
                const activeCatalog = isWithoutSupplier ? inventoryCatalog : catalog;
                const selectedItem = activeCatalog.find(
                  entry => entry.item_type === item.item_type && entry.item_id === item.item_id
                );
                const unit = selectedItem?.unit ?? 'unidad';
                const unitPrice = isWithoutSupplier
                  ? (item.unit_price ?? 0)
                  : Number(selectedItem?.unit_price ?? 0);

                return (
                  <div key={index} className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-slate-50/50">
                    {isLocked && (
                      <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        Regularización de inventario: cantidad vinculada directamente al stock existente.
                      </p>
                    )}
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-xs font-medium text-slate-600">Recurso *</label>
                      <select
                        value={item.item_id === '' ? '' : `${item.item_type}:${item.item_id}`}
                        onChange={e => {
                          const [item_type, item_id] = e.target.value.split(':');
                          updateItemRow(index, {
                            item_type: (item_type || 'supply') as 'supply' | 'tool',
                            item_id: item_id ? Number(item_id) : '',
                          });
                        }}
                        required
                        disabled={isLocked || (!isWithoutSupplier && (!form.supplier_id || catalog.length === 0))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white disabled:bg-slate-100"
                      >
                        <option value="">Selecciona un ítem…</option>
                        {activeCatalog.map(catalogItem => (
                          <option
                            key={`${catalogItem.item_type}-${catalogItem.item_id}`}
                            value={`${catalogItem.item_type}:${catalogItem.item_id}`}
                          >
                            {catalogItem.item_type === 'tool' ? 'Herramienta' : 'Insumo'} · {catalogItem.name} ({catalogItem.code}) · {catalogItem.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          disabled={isLocked}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Precio Unitario ($) *</label>
                        {isWithoutSupplier ? (
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={item.unit_price ?? ''}
                            onChange={e => updateItemRow(index, { unit_price: Number(e.target.value) })}
                            required
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                          />
                        ) : (
                          <div className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-slate-100 text-slate-700">
                            ${unitPrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {items.length > 1 && !isLocked && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="w-full rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                      >
                        Quitar este ítem
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/80 pt-3.5">
            <span className="text-sm font-semibold text-slate-600">Total Estimado</span>
            <span className="text-xl font-bold text-slate-800 font-mono">${total.toFixed(2)}</span>
          </div>

          <Button type="submit" isLoading={isSaving} className="w-full">Generar Orden</Button>
        </form>
      </SlideOver>

      {/* SlideOver Registrar Recepción */}
      <SlideOver
        isOpen={isReceiveOpen}
        onClose={closeReceive}
        title="Registrar Recepción"
        subtitle={receivingOrder ? `Orden ${receivingOrder.order_number}` : ''}
      >
        <form onSubmit={handleReceive} className="p-6 space-y-4">
          {receivingOrder?.items && receivingOrder.items.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Ítems a recibir</p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {receivingOrder.items.map(item => (
                  <li key={item.id} className="flex justify-between items-center">
                    <span>{item.item_name}</span>
                    <span className="text-xs font-mono font-semibold text-slate-500">{item.quantity} {item.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Estado de Calidad *</label>
            <select
              value={receiveForm.quality_status}
              onChange={e => setReceiveForm({ ...receiveForm, quality_status: e.target.value as typeof receiveForm.quality_status })}
              required
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition"
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
              rows={3}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm resize-none transition"
              placeholder="Detalles sobre el estado físico de los ítems entregados..."
            />
          </div>
          <Button type="submit" isLoading={isReceiving} className="w-full">Confirmar Recepción</Button>
        </form>
      </SlideOver>
    </div>
  );
};
