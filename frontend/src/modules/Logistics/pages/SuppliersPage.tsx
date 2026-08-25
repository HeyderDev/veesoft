import React, { useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { SlideOver } from '../../../components/ui/SlideOver';
import { SupplierSpendReportPanel } from '../components/SupplierSpendReportPanel';
import { useSuppliersViewModel } from '../viewmodels/useSuppliersViewModel';
import type { Supplier, UnregisteredItem } from '../types';

function scoreBadgeVariant(score: string): 'success' | 'warning' | 'danger' {
  const value = Number(score);
  if (value >= 4) return 'success';
  if (value >= 3) return 'warning';
  return 'danger';
}

const evaluationCriteria: { key: 'compliance' | 'quality' | 'punctuality' | 'price' | 'after_sales_service'; label: string; weight: string }[] = [
  { key: 'quality', label: 'Calidad', weight: '40%' },
  { key: 'punctuality', label: 'Puntualidad', weight: '30%' },
  { key: 'price', label: 'Precio', weight: '20%' },
  { key: 'after_sales_service', label: 'Servicio Postventa', weight: '10%' },
  { key: 'compliance', label: 'Cumplimiento', weight: 'informativo' },
];

interface SuppliersPageProps {
  /** Ítem que viene desde el aviso de "Ítems sin orden de compra" de Órdenes, esperando vincularse al catálogo de un proveedor. */
  pendingLinkItem?: UnregisteredItem | null;
  onLinkHandled?: () => void;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({ pendingLinkItem, onLinkHandled }) => {
  const {
    suppliers, certificateAlerts, isLoading, hasMoreSuppliers, isLoadingMoreSuppliers, loadMoreSuppliers,
    isFormOpen, editSupplier, openCreate, openEdit, closeForm, form, setForm, isSaving, handleSave, handleDelete,
    isEvaluateOpen, evaluatingSupplier, openEvaluate, closeEvaluate, evaluateForm, setEvaluateForm, isEvaluating, handleEvaluate,
    isCatalogOpen, catalogSupplier, availableSupplies, catalogItems, openCatalog, closeCatalog,
    addCatalogItem, removeCatalogItem, updateCatalogItem, saveCatalog, isSavingCatalog,
  } = useSuppliersViewModel();

  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);

  const handleOpenCatalog = (supplier: Supplier) => {
    setDetailSupplier(null);
    if (pendingLinkItem) {
      openCatalog(supplier, { item_type: pendingLinkItem.item_type, item_id: pendingLinkItem.item_id });
      onLinkHandled?.();
    } else {
      openCatalog(supplier);
    }
  };

  const handleOpenEvaluate = (supplier: Supplier) => { setDetailSupplier(null); openEvaluate(supplier); };
  const handleOpenEdit = (supplier: Supplier) => { setDetailSupplier(null); openEdit(supplier); };
  const handleDeleteFromDetail = (supplier: Supplier) => { setDetailSupplier(null); handleDelete(supplier); };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-1">Directorio, calificación y catálogo de insumos de proveedores</p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Proveedor</Button>
      </div>

      {pendingLinkItem && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800">
            Vincula <strong>{pendingLinkItem.name}</strong> al catálogo de un proveedor: haz clic en <strong>&quot;Catálogo&quot;</strong> del proveedor que lo suministrará.
          </p>
          <button
            type="button"
            onClick={() => onLinkHandled?.()}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap"
          >
            Cancelar
          </button>
        </div>
      )}

      {!isLoading && certificateAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">Certificados orgánicos por vencer</h3>
          </div>
          <ul className="space-y-1.5 text-sm text-amber-800">
            {certificateAlerts.map(alert => (
              <li key={alert.supplier_id} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium">{alert.supplier_name}</span>:
                <Badge variant={alert.status === 'expired' ? 'danger' : 'warning'}>
                  {alert.status === 'expired' ? 'Vencido' : `Vence en ${alert.days_remaining} días`}
                </Badge>
                <span className="text-xs text-amber-700">({alert.certificate_expires_at})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">Aún no hay proveedores registrados.</p>
        </div>
      ) : (
        <>
          {/* Desktop: tabla completa (lg+) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto overflow-y-auto max-h-[560px] max-w-[90%] mx-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">RUC / CI</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificado Orgánico</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{supplier.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{supplier.tax_id}</td>
                    <td className="px-4 py-3">
                      <Badge variant={scoreBadgeVariant(supplier.score)}>{Number(supplier.score).toFixed(2)} / 5.00</Badge>
                      {Number(supplier.score) < 3 && (
                        <span className="ml-2 text-xs text-rose-500 inline-flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Score insuficiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {supplier.organic_certified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sí
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={supplier.status === 'active' ? 'success' : 'neutral'}>
                        {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                      <Button variant="ghost" onClick={() => openEvaluate(supplier)}>Evaluar</Button>
                      <Button variant="ghost" onClick={() => handleOpenCatalog(supplier)}>Catálogo</Button>
                      <Button variant="ghost" onClick={() => openEdit(supplier)}>Editar</Button>
                      <Button variant="danger" onClick={() => handleDelete(supplier)}>Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: solo Nombre/Score, el resto vive en el detalle (lg:hidden) */}
          <div className="lg:hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto overflow-y-auto max-h-[560px]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(supplier => (
                  <tr key={supplier.id} onClick={() => setDetailSupplier(supplier)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{supplier.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={scoreBadgeVariant(supplier.score)}>{Number(supplier.score).toFixed(2)} / 5.00</Badge>
                      {Number(supplier.score) < 3 && (
                        <span className="ml-2 text-xs text-rose-500 inline-flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Score insuficiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hasMoreSuppliers && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={loadMoreSuppliers} isLoading={isLoadingMoreSuppliers}>
            Cargar 20 más
          </Button>
        </div>
      )}

      <SupplierSpendReportPanel />

      {/* Detalle del proveedor (mobile) — info completa y acciones al seleccionar una fila */}
      <Modal isOpen={!!detailSupplier} onClose={() => setDetailSupplier(null)} title={detailSupplier?.name ?? ''}>
        {detailSupplier && (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={scoreBadgeVariant(detailSupplier.score)}>{Number(detailSupplier.score).toFixed(2)} / 5.00</Badge>
              <Badge variant={detailSupplier.status === 'active' ? 'success' : 'neutral'}>
                {detailSupplier.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
              {Number(detailSupplier.score) < 3 && (
                <span className="text-xs text-rose-500 inline-flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Score insuficiente</span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">RUC / CI</dt>
                <dd className="text-slate-700 font-mono">{detailSupplier.tax_id}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Certificado orgánico</dt>
                <dd className="text-slate-700">{detailSupplier.organic_certified ? 'Sí' : 'No'}</dd>
              </div>
              {detailSupplier.phone && (
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Teléfono</dt>
                  <dd className="text-slate-700">{detailSupplier.phone}</dd>
                </div>
              )}
              {detailSupplier.email && (
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Email</dt>
                  <dd className="text-slate-700">{detailSupplier.email}</dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => handleOpenEvaluate(detailSupplier)}>Evaluar</Button>
              <Button variant="ghost" onClick={() => handleOpenCatalog(detailSupplier)}>Catálogo</Button>
              <Button variant="ghost" onClick={() => handleOpenEdit(detailSupplier)}>Editar</Button>
              <Button variant="danger" onClick={() => handleDeleteFromDetail(detailSupplier)}>Eliminar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* SlideOver Formulario Proveedor */}
      <SlideOver
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      >
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
            <input
              value={form.name ?? ''}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">RUC / Cédula * (10 o 13 dígitos)</label>
            <input
              value={form.tax_id ?? ''}
              onChange={e => setForm({ ...form, tax_id: e.target.value.replace(/\D/g, '').slice(0, 13) })}
              inputMode="numeric"
              required
              maxLength={13}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-mono transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono (máx. 10 dígitos)</label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone ?? ''}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                maxLength={10}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-mono transition"
              />
            </div>
          </div>
          <fieldset className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <legend className="px-1 text-xs font-semibold text-slate-700 uppercase tracking-wider">¿Cuenta con certificado orgánico? *</legend>
            <div className="flex gap-5 text-sm text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.organic_certified === true}
                  onChange={() => setForm({ ...form, organic_certified: true, certification: { ...form.certification, has_certificate: true } })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Sí
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.organic_certified === false}
                  onChange={() => setForm({ ...form, organic_certified: false, certification: { ...form.certification, has_certificate: false } })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                No
              </label>
            </div>

            {form.organic_certified && (
              <div className="border-t border-slate-200/80 pt-3 space-y-3">
                <p className="text-xs text-slate-500">Datos de respaldo opcionales. Puedes completarlos ahora o editar el proveedor después.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">N° de certificado</label>
                    <input value={form.certification?.certificate_number ?? ''} onChange={e => setForm({ ...form, certification: { ...form.certification!, certificate_number: e.target.value } })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Entidad certificadora</label>
                    <input value={form.certification?.certifying_entity ?? ''} onChange={e => setForm({ ...form, certification: { ...form.certification!, certifying_entity: e.target.value } })} placeholder="Ej.: Ecocert" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de emisión</label>
                    <input type="date" value={form.certification?.issued_at ?? ''} onChange={e => setForm({ ...form, certification: { ...form.certification!, issued_at: e.target.value } })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de vencimiento</label>
                    <input type="date" value={form.certification?.expires_at ?? ''} onChange={e => setForm({ ...form, certification: { ...form.certification!, expires_at: e.target.value } })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Documento de respaldo (PDF, JPG o PNG)</label>
                  <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setForm({ ...form, certification: { ...form.certification!, file: e.target.files?.[0] ?? null } })} className="block w-full text-sm text-slate-600" />
                  {form.certification?.file_path && (
                    <p className="mt-1 text-xs text-slate-500">
                      Ya existe un documento adjunto.{' '}
                      <a href={`/storage/${form.certification.file_path}`} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 underline">Ver documento</a>
                      {' '}o selecciona otro archivo para sustituirlo.
                    </p>
                  )}
                </div>
              </div>
            )}
          </fieldset>
          <div className="pt-2">
            <Button type="submit" isLoading={isSaving} className="w-full">
              {editSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* SlideOver Catálogo */}
      <SlideOver isOpen={isCatalogOpen} onClose={closeCatalog} title="Catálogo del Proveedor" subtitle={catalogSupplier?.name}>
        <form onSubmit={saveCatalog} className="p-6 space-y-4">
          <p className="text-sm text-slate-500">Selecciona los insumos o herramientas que ofrece y registra el precio según su unidad de compra.</p>
          {catalogItems.map((item, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-3.5 space-y-3 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_8.75rem] gap-3 items-start">
                <select
                  value={item.item_id === '' ? '' : `${item.item_type}:${item.item_id}`}
                  onChange={event => {
                    const [item_type, item_id] = event.target.value.split(':');
                    updateCatalogItem(index, { item_type: (item_type || 'supply') as 'supply' | 'tool', item_id: item_id ? Number(item_id) : '' });
                  }}
                  required
                  className="min-w-0 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">Selecciona un ítem…</option>
                  {availableSupplies.map(catalogItem => (
                    <option key={`${catalogItem.item_type}-${catalogItem.item_id}`} value={`${catalogItem.item_type}:${catalogItem.item_id}`}>
                      {catalogItem.item_type === 'tool' ? 'Herramienta' : 'Insumo'} · {catalogItem.name} ({catalogItem.code}) · {catalogItem.unit}
                    </option>
                  ))}
                </select>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Precio unitario ($)</label>
                  <input
                    type="number" min={0} step="0.01" required
                    value={item.unit_price}
                    onChange={event => updateCatalogItem(index, { unit_price: Number(event.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-mono"
                    aria-label="Precio unitario"
                  />
                  <p className="mt-1 text-xs text-slate-500 text-center">
                    por {availableSupplies.find(entry => entry.item_type === item.item_type && entry.item_id === item.item_id)?.unit ?? 'unidad'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeCatalogItem(index)}
                className="w-full rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
              >
                Quitar este ítem
              </button>
            </div>
          ))}
          <button type="button" onClick={addCatalogItem} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">+ Agregar ítem al catálogo</button>
          <Button type="submit" isLoading={isSavingCatalog} className="w-full">Guardar Catálogo</Button>
        </form>
      </SlideOver>

      {/* SlideOver Evaluar */}
      <SlideOver
        isOpen={isEvaluateOpen}
        onClose={closeEvaluate}
        title="Evaluar Proveedor"
        subtitle={evaluatingSupplier?.name}
      >
        <form onSubmit={handleEvaluate} className="p-6 space-y-4">
          {evaluationCriteria.map(({ key, label, weight }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {label} <span className="text-slate-400">({weight})</span>
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={evaluateForm[key]}
                onChange={e => setEvaluateForm({ ...evaluateForm, [key]: Number(e.target.value) })}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-mono transition"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Comentario</label>
            <textarea
              value={evaluateForm.comment ?? ''}
              onChange={e => setEvaluateForm({ ...evaluateForm, comment: e.target.value })}
              rows={2}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm resize-none transition"
            />
          </div>
          <div className="pt-2">
            <Button type="submit" isLoading={isEvaluating} className="w-full">Registrar Evaluación</Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
