import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { calculateLotCapacity } from '../utils/lotCapacity';
import { LotDiagram } from './LotDiagram';
import type { LotCreateInput } from '../types';

interface LotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: LotCreateInput;
  setForm: React.Dispatch<React.SetStateAction<LotCreateInput>>;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const numberField = (
  label: string,
  value: number,
  onChange: (value: number) => void,
  props: { min?: number; step?: number; required?: boolean } = {},
) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      type="number"
      value={Number.isFinite(value) ? value : ''}
      onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      min={props.min ?? 0}
      step={props.step ?? 'any'}
      required={props.required ?? true}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
    />
  </div>
);

export const LotFormModal: React.FC<LotFormModalProps> = ({
  isOpen, onClose, form, setForm, isSaving, onSubmit,
}) => {
  const result = calculateLotCapacity({
    width: form.width,
    length: form.length,
    fundaDiameter: form.funda_diameter,
    corridorCount: form.corridor_count,
    corridorWidth: form.corridor_width,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Lote" subtitle="La capacidad se calcula automáticamente a partir de la geometría" maxWidthClassName="max-w-5xl">
      <form onSubmit={onSubmit} className="flex flex-col md:flex-row h-full">
        {/* Vista previa dinámica */}
        <div className="md:w-1/2 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vista previa del plano</p>
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            <LotDiagram
              width={form.width}
              length={form.length}
              fundaDiameter={form.funda_diameter}
              corridorCount={form.corridor_count}
              corridorWidth={form.corridor_width}
              className="w-full max-h-[320px]"
            />
          </div>
          <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4 text-center">
            {result.isValid ? (
              <>
                <p className="text-3xl font-bold text-emerald-600">{result.capacity.toLocaleString('es')}</p>
                <p className="text-xs text-slate-500 mt-1">plántulas estimadas en este lote</p>
              </>
            ) : (
              <p className="text-sm text-rose-600">{result.error || 'Completa las dimensiones para calcular la capacidad'}</p>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="md:w-1/2 flex flex-col">
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del lote *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Ej: Lote Norte A"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {numberField('Ancho (m) *', form.width, v => setForm({ ...form, width: v }), { min: 0.1 })}
              {numberField('Largo (m) *', form.length, v => setForm({ ...form, length: v }), { min: 0.1 })}
            </div>

            {numberField('Diámetro de funda (cm)', form.funda_diameter, v => setForm({ ...form, funda_diameter: v }), { min: 1 })}

            <div className="grid grid-cols-2 gap-4">
              {numberField('N.º de corredores *', form.corridor_count, v => setForm({ ...form, corridor_count: Math.round(v) }), { min: 0, step: 1 })}
              {numberField('Ancho de corredor (cm) *', form.corridor_width, v => setForm({ ...form, corridor_width: v }), { min: 0, required: form.corridor_count > 0 })}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm resize-none"
              />
            </div>

            {result.isValid && (
              <p className="text-sm text-slate-600">
                Capacidad calculada: <span className="font-bold text-slate-800">{result.capacity.toLocaleString('es')} plántulas</span>
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 p-6 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving} disabled={!result.isValid}>Crear Lote</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
