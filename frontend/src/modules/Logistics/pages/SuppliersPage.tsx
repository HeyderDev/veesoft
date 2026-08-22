import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { SlideOver } from '../../../components/ui/SlideOver';
import { useSuppliersViewModel } from '../viewmodels/useSuppliersViewModel';

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

export const SuppliersPage: React.FC = () => {
  const {
    suppliers, isLoading,
    isFormOpen, editSupplier, openCreate, openEdit, closeForm, form, setForm, isSaving, handleSave, handleDelete,
    isEvaluateOpen, evaluatingSupplier, openEvaluate, closeEvaluate, evaluateForm, setEvaluateForm, isEvaluating, handleEvaluate,
  } = useSuppliersViewModel();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-1">Directorio, calificación y estado de tus proveedores</p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Proveedor</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-500">Aún no hay proveedores registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
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
                    <Button variant="ghost" onClick={() => openEdit(supplier)}>Editar</Button>
                    <Button variant="danger" onClick={() => handleDelete(supplier)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Vencimiento certificado</label>
            <input
              type="date"
              value={form.certificate_expires_at ?? ''}
              onChange={e => setForm({ ...form, certificate_expires_at: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.organic_certified ?? false}
              onChange={e => setForm({ ...form, organic_certified: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Certificado orgánico
          </label>
          <div className="pt-2">
            <Button type="submit" isLoading={isSaving} className="w-full">
              {editSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
            </Button>
          </div>
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
