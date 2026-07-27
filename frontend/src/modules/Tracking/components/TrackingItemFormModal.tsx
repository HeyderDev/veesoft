import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import type { TrackingItem, TrackingItemInput, TrackingStage } from '../types';

const stageOptions: { value: TrackingStage; label: string }[] = [
  { value: 'germination', label: 'Germinación' },
  { value: 'nursery', label: 'Vivero' },
  { value: 'transplant', label: 'Trasplante' },
  { value: 'ready_for_dispatch', label: 'Listo para entrega' },
];

interface TrackingItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: TrackingItem | null;
  form: TrackingItemInput;
  setForm: React.Dispatch<React.SetStateAction<TrackingItemInput>>;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const TrackingItemFormModal: React.FC<TrackingItemFormModalProps> = ({
  isOpen, onClose, editingItem, form, setForm, isSaving, onSubmit,
}) => {
  const isEdit = editingItem !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Actualizar lote en seguimiento' : 'Registrar lote en seguimiento'}
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del lote *</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Especie / variedad *</label>
            <input
              value={form.species}
              onChange={e => setForm({ ...form, species: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Etapa de crecimiento *</label>
            <select
              value={form.stage}
              onChange={e => setForm({ ...form, stage: e.target.value as TrackingStage })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            >
              {stageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad {isEdit && '(no editable aquí)'}</label>
              <input
                type="number"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                min={0}
                required
                disabled={isEdit}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de medida *</label>
              <input
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación en el vivero *</label>
            <input
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock mínimo (para alertas) *</label>
            <input
              type="number"
              value={form.minimum_stock}
              onChange={e => setForm({ ...form, minimum_stock: Number(e.target.value) })}
              min={0}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción / observaciones</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm resize-none"
            />
          </div>

          {isEdit && (
            <p className="text-xs text-slate-400">
              La cantidad solo se ajusta registrando un movimiento de entrada o salida, no editando el lote.
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={isSaving}>{isEdit ? 'Guardar cambios' : 'Registrar lote'}</Button>
        </div>
      </form>
    </Modal>
  );
};
