import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import type { Lote } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

interface RescheduleModalProps {
  lote: Lote | undefined;
  onClose: () => void;
  isSaving: boolean;
  onConfirm: (lotId: number, transitionDate: string) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ lote, onClose, isSaving, onConfirm }) => {
  const currentPhase = lote?.active_cycle?.current_phase;
  const phases = lote?.active_cycle?.phases ?? [];
  const currentIndex = phases.findIndex(p => p.id === currentPhase?.id);
  const nextPhase = currentIndex >= 0 ? phases[currentIndex + 1] : undefined;

  const [transitionDate, setTransitionDate] = useState(currentPhase?.planned_end_date || today());

  if (!lote || !currentPhase || !nextPhase) return null;

  const handleConfirm = () => onConfirm(lote.id, transitionDate);

  return (
    <Modal isOpen={!!lote} onClose={onClose} title="Reprogramar fase" subtitle={lote.name} maxWidthClassName="max-w-md">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
            {currentPhase.phase?.name}
          </span>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium">
            {nextPhase.phase?.name}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            ¿Cuándo pasa el lote a la siguiente fase?
          </label>
          <input
            type="date"
            value={transitionDate}
            min={currentPhase.planned_start_date}
            onChange={e => setTransitionDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          />
          <p className="text-xs text-slate-400 mt-2">
            Originalmente estaba planificado para el {currentPhase.planned_end_date}. Si eliges una fecha distinta
            (antes = adelanto, después = atraso), el sistema recalculará automáticamente todas las fases siguientes
            respetando sus duraciones configuradas.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="button" variant="primary" onClick={handleConfirm} isLoading={isSaving}>
            Confirmar reprogramación
          </Button>
        </div>
      </div>
    </Modal>
  );
};
