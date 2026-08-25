import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
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
    suppliers, certificateAlerts, isLoading,
    isFormOpen, editSupplier, openCreate, openEdit, closeForm, form, setForm, isSaving, handleSave, handleDelete,
    isEvaluateOpen, evaluatingSupplier, openEvaluate, closeEvaluate, evaluateForm, setEvaluateForm, isEvaluating, handleEvaluate,
    isCatalogOpen, catalogSupplier, availableSupplies, catalogItems, openCatalog, closeCatalog,
    addCatalogItem, removeCatalogItem, updateCatalogItem, saveCatalog, isSavingCatalog,
  } = useSuppliersViewModel();

  const handleOpenCatalog = (supplier: Supplier) => {
    if (pendingLinkItem) {
      openCatalog(supplier, { item_type: pendingLinkItem.item_type, item_id: pendingLinkItem.item_id });
      onLinkHandled?.();
    } else {
      openCatalog(supplier);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-1">Directorio, calificación y estado de tus proveedores</p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Proveedor</Button>
      </div>

      {pendingLinkItem && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800">
            Vincula <strong>{pendingLinkItem.name}</strong> al catálogo de un proveedor: haz clic en <strong>&quot;Catálogo&quot;</strong> del proveedor que lo suministrará.
          </p>
          <button
            type="button"
            onClick={() => onLinkHandled?.()}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap"
          >
            Cancelar
          </button>
        </div>
      )}

      {!isLoading && certificateAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-bold text-amber-900">Certificados orgánicos por vencer</h3>
          <ul className="mt-1 text-sm text-amber-800">
            {certificateAlerts.map(alert => (
              <li key={alert.supplier_id}>
                {alert.supplier_name}: {alert.status === 'expired' ? 'vencido' : `vence en ${alert.days_remaining} días`} ({alert.certificate_expires_at})
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-500">Aún no hay proveedores registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto overflow-y-auto max-h-[560px]">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">RUC/CI</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificado Orgánico</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map(supplier => (
                <tr key={supplier.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{supplier.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{supplier.tax_id}</td>
                  <td className="px-4 py-3">
                    <Badge variant={scoreBadgeVariant(supplier.score)}>{Number(supplier.score).toFixed(2)} / 5.00</Badge>
                    {Number(supplier.score) < 3 && (
                      <span className="ml-2 text-xs text-red-500">⚠ Score insuficiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{supplier.organic_certified ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={supplier.status === 'active' ? 'success' : 'neutral'}>
                      {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
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
      )}

      <SupplierSpendReportPanel />

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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">RUC / Cédula *</label>
            <input
              value={form.tax_id ?? ''}
              onChange={e => setForm({ ...form, tax_id: e.target.value })}
              required
              maxLength={13}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
              <input
                value={form.phone ?? ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>
          <fieldset className="rounded-lg border border-slate-200 p-3 space-y-3">
            <legend className="px-1 text-sm font-medium text-slate-700">¿El proveedor cuenta con certificado orgánico? *</legend>
            <div className="flex gap-5 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.organic_certified === true}
                  onChange={() => setForm({ ...form, organic_certified: true, certification: { ...form.certification, has_certificate: true } })}
                />
                Sí
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.organic_certified === false}
                  onChange={() => setForm({ ...form, organic_certified: false, certification: { ...form.certification, has_certificate: false } })}
                />
                No
              </label>
            </div>

            {form.organic_certified && (
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="text-xs text-slate-500">Datos de respaldo opcionales. Puedes completarlos ahora o editar el proveedor después.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">N° de certificado</label>
                    <input value={form.certification?.certificate_number ?? ''} onChange={e => setForm({ ...form, certification: { ...form.certification!, certificate_number: e.target.value } })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Entidad certificadora</label>
                    <input value={form.certification?.certifying_entity ?? ''} onChange={e => setForm({ ...form, certification: { ...form.certification!, certifying_entity: e.target.value } })} placeholder="Ej.: Ecocert" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de emisión</label>
                    <input type="date" value={form.certification?.issued_at ?? ''} onChange={e => setForm({ ...form, certification: { ...form.certification!, issued_at: e.target.value } })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de vencimiento</label>
                    <input type="date" value={form.certification?.expires_at ?? ''} onChange={e => setForm({ ...form, certification: { ...form.certification!, expires_at: e.target.value } })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
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

      <SlideOver isOpen={isCatalogOpen} onClose={closeCatalog} title="Catálogo del Proveedor" subtitle={catalogSupplier?.name}>
        <form onSubmit={saveCatalog} className="p-6 space-y-4">
          <p className="text-sm text-slate-500">Selecciona los insumos o herramientas que ofrece y registra el precio según su unidad de compra.</p>
          {catalogItems.map((item, index) => (
            <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_8.75rem] gap-3 items-start">
                <select
                  value={item.item_id === '' ? '' : `${item.item_type}:${item.item_id}`}
                  onChange={event => {
                    const [item_type, item_id] = event.target.value.split(':');
                    updateCatalogItem(index, { item_type: (item_type || 'supply') as 'supply' | 'tool', item_id: item_id ? Number(item_id) : '' });
                  }}
                  required
                  className="min-w-0 w-full px-2 py-2 border border-slate-300 rounded text-sm"
                >
                  <option value="">Selecciona un ítem…</option>
                  {availableSupplies.map(catalogItem => (
                    <option key={`${catalogItem.item_type}-${catalogItem.item_id}`} value={`${catalogItem.item_type}:${catalogItem.item_id}`}>
                      {catalogItem.item_type === 'tool' ? 'Herramienta' : 'Insumo'} · {catalogItem.name} ({catalogItem.code}) · {catalogItem.unit}
                    </option>
                  ))}
                </select>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Precio unitario</label>
                  <input
                    type="number" min={0} step="0.01" required
                    value={item.unit_price}
                    onChange={event => updateCatalogItem(index, { unit_price: Number(event.target.value) })}
                    className="w-full px-2 py-2 border border-slate-300 rounded text-sm"
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
                className="w-full rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Quitar este ítem
              </button>
            </div>
          ))}
          <button type="button" onClick={addCatalogItem} className="text-sm font-medium text-emerald-600">+ Agregar ítem</button>
          <Button type="submit" isLoading={isSavingCatalog} className="w-full">Guardar Catálogo</Button>
        </form>
      </SlideOver>

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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Comentario</label>
            <textarea
              value={evaluateForm.comment ?? ''}
              onChange={e => setEvaluateForm({ ...evaluateForm, comment: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm resize-none"
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
