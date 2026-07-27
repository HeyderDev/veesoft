import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import type { Fase } from '../types';

interface FaseModalProps {
  fase: Fase;
  onClose: () => void;
  onSave: (data: Partial<Fase>) => void;
}

export const FaseModal: React.FC<FaseModalProps> = ({ fase, onClose, onSave }) => {
  const isDespacho = fase.code === 'DESP';
  const [form, setForm] = useState({
    estimated_duration_days: fase.estimated_duration_days,
    description: fase.description,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Despacho no tiene una duración configurable — no se envía ese campo.
    onSave(isDespacho ? { description: form.description } : form);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Editar Fase" subtitle={fase.name} maxWidthClassName="max-w-md">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {isDespacho ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              Despacho no tiene una duración fija configurable — comienza cuando termina la fase anterior y
              permanece abierta hasta que se registre el despacho del lote (botón "Terminar Despacho").
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
