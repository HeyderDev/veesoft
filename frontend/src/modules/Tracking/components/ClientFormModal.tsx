import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import type { TrackingClientInput } from '../types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  form: TrackingClientInput;
  setForm: React.Dispatch<React.SetStateAction<TrackingClientInput>>;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const onlyLetters = (value: string) => value.replace(/[^\p{L}\s]/gu, '');

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen, onClose, isEdit, form, setForm, isSaving, onSubmit,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Actualizar cliente' : 'Registrar cliente'} maxWidthClassName="max-w-md">
      <form onSubmit={onSubmit} className="flex flex-col">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre cliente / corporación *</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: onlyLetters(e.target.value) })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula *</label>
            <input
              value={form.cedula}
              onChange={e => setForm({ ...form, cedula: onlyDigits(e.target.value).slice(0, 10) })}
              inputMode="numeric"
              maxLength={10}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número celular *</label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: onlyDigits(e.target.value).slice(0, 10) })}
              inputMode="numeric"
              maxLength={10}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={isSaving}>{isEdit ? 'Guardar cambios' : 'Registrar cliente'}</Button>
        </div>
      </form>
    </Modal>
  );
};
