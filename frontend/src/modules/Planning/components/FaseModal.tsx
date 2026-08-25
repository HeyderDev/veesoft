import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import type { Fase } from '../types';
import { isGatedPhaseCode } from '../types';

interface FaseModalProps {
  fase: Fase;
  onClose: () => void;
  onSave: (data: Partial<Fase>) => void;
}

const GATED_PHASE_MESSAGE: Record<string, string> = {
  DESP: 'Despacho arranca calculada en 1 día. Si el despacho se demora, se extiende sola hasta el día en que se registre (botón "Terminar Despacho") y el resto del calendario no cambia porque es la última fase.',
  SIEM: 'Siembra arranca calculada en 1 día. Si la actividad de Siembra se confirma más tarde en Tareas, esa fase se extiende hasta ese día y las siguientes se recalculan solas.',
  INJER: 'Injertación arranca calculada en 1 día. Si la actividad de Injerto se confirma más tarde en Tareas, esa fase se extiende hasta ese día y las siguientes se recalculan solas.',
};

export const FaseModal: React.FC<FaseModalProps> = ({ fase, onClose, onSave }) => {
  const isGated = isGatedPhaseCode(fase.code);
  const [form, setForm] = useState({
    estimated_duration_days: fase.estimated_duration_days,
    description: fase.description,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Las fases gateadas (Siembra/Injertación/Despacho) no tienen duración
    // editable — no se envía ese campo, solo la descripción.
    onSave(isGated ? { description: form.description } : form);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Editar Fase" subtitle={fase.name} maxWidthClassName="max-w-md">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {isGated ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              {GATED_PHASE_MESSAGE[fase.code] ?? 'Esta fase es una actividad obligatoria del sistema — su duración de catálogo no es editable.'}
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Duración estimada (días)</label>
            <input type="number" min={1}
              value={form.estimated_duration_days}
              onChange={e => setForm(prev => ({ ...prev, estimated_duration_days: Number(e.target.value) }))}
              className="input-field" required />
            <p className="text-xs text-slate-400 mt-1">
              Cambiar esta duración reprograma automáticamente todos los lotes con un ciclo en curso, desde su fase
              actual en adelante.
            </p>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Descripción</label>
          <textarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="input-field resize-none" rows={3} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary">Guardar cambios</button>
        </div>
      </form>
    </Modal>
  );
};
