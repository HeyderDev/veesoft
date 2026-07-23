import React, { useEffect, useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import type { Fase, Lote } from '../types';
import { capacityToleranceRange } from '../utils/lotCapacity';
import { LotDiagram } from './LotDiagram';

const statusConfig: Record<Lote['current_status'], { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  available: { label: 'Disponible', variant: 'success' },
  occupied: { label: 'Ocupado', variant: 'warning' },
  inactive: { label: 'Inactivo', variant: 'neutral' },
};

function formatDate(value: string | null): string {
  if (!value) return 'sin fin definido';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

type SectionId = 'datos' | 'ciclo' | 'capacidad' | 'configuracion';

interface AccordionSectionProps {
  id: SectionId;
  title: string;
  isOpen: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}

/** Encabezado clickeable + contenido condicional — solo una sección abierta a la vez. */
const AccordionSection: React.FC<AccordionSectionProps> = ({ id, title, isOpen, onToggle, children }) => (
  <div className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="w-full flex items-center justify-between text-left"
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      <svg
        className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && <div className="mt-4">{children}</div>}
  </div>
);

interface LotDetailModalProps {
  lote: Lote | undefined;
  onClose: () => void;
  editForm: { name: string; notes: string };
  setEditForm: React.Dispatch<React.SetStateAction<{ name: string; notes: string }>>;
  capacityInput: number;
  setCapacityInput: (value: number) => void;
  isSaving: boolean;
  onSaveEdit: (e: React.FormEvent) => void;
  onUpdateCapacity: () => void;
  onSetInactive: () => void;
  onSetAvailable: () => void;
  onDelete: () => void;
  fases: Fase[];
  cycleStartDate: string;
  setCycleStartDate: (value: string) => void;
  startingPhaseId: number | undefined;
  setStartingPhaseId: (value: number) => void;
  isStartingCycle: boolean;
  onStartCycle: () => void;
  onTerminateDispatch: () => void;
}

export const LotDetailModal: React.FC<LotDetailModalProps> = ({
  lote, onClose, editForm, setEditForm, capacityInput, setCapacityInput, isSaving,
  onSaveEdit, onUpdateCapacity, onSetInactive, onSetAvailable, onDelete,
  fases, cycleStartDate, setCycleStartDate, startingPhaseId, setStartingPhaseId,
  isStartingCycle, onStartCycle, onTerminateDispatch,
}) => {
  const [openSection, setOpenSection] = useState<SectionId>('datos');

  useEffect(() => {
    if (!lote) return;
    const needsCycleAttention =
      // Sin ciclo y disponible: la acción relevante es comenzar uno.
      (!lote.active_cycle && lote.current_status === 'available') ||
      // Llegó a Despacho: la acción relevante es terminarlo y liberar el lote.
      lote.active_cycle?.current_phase?.phase?.code === 'DESP';
    setOpenSection(needsCycleAttention ? 'ciclo' : 'datos');
  }, [lote?.id, lote?.active_cycle?.current_phase?.phase?.code]);

  if (!lote) return null;

  const { min, max } = capacityToleranceRange(lote.calculated_capacity);
  const status = statusConfig[lote.current_status];
  const activeCycle = lote.active_cycle;
  const isInDespacho = activeCycle?.current_phase?.phase?.code === 'DESP';

  return (
    <Modal isOpen={!!lote} onClose={onClose} title={lote.name} subtitle={`Código ${lote.code}`} maxWidthClassName="max-w-5xl">
      <div className="flex flex-col md:flex-row h-full">
        <div className="md:w-1/2 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Plano del lote</p>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            <LotDiagram
              width={Number(lote.width)}
              length={Number(lote.length)}
              fundaDiameter={Number(lote.funda_diameter)}
              corridorCount={lote.corridor_count}
              corridorWidth={Number(lote.corridor_width)}
              className="w-full max-h-[320px]"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-xl font-bold text-slate-800">{lote.calculated_capacity.toLocaleString('es')}</p>
              <p className="text-[11px] text-slate-500">calculada por geometría</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-xl font-bold text-emerald-600">{lote.total_capacity.toLocaleString('es')}</p>
              <p className="text-[11px] text-slate-500">capacidad en uso</p>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col">
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            <AccordionSection id="datos" title="Datos generales" isOpen={openSection === 'datos'} onToggle={setOpenSection}>
              <form onSubmit={onSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm resize-none"
                  />
                </div>
                <Button type="submit" variant="secondary" isLoading={isSaving} className="w-full">
                  Guardar cambios
                </Button>
              </form>
            </AccordionSection>

            <AccordionSection id="ciclo" title="Ciclo Productivo" isOpen={openSection === 'ciclo'} onToggle={setOpenSection}>
              {!activeCycle && lote.current_status === 'available' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Elige desde qué fase arranca el lote (por ejemplo, un lote ya preparado puede comenzar
                    directo en Siembra) y la fecha de inicio — el sistema calculará el calendario completo desde ahí.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Fase inicial</label>
                      <select
                        value={startingPhaseId ?? ''}
                        onChange={e => setStartingPhaseId(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      >
                        {fases.map(fase => (
                          <option key={fase.id} value={fase.id}>{fase.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Fecha de inicio</label>
                      <input
                        type="date"
                        value={cycleStartDate}
                        onChange={e => setCycleStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <Button type="button" variant="primary" onClick={onStartCycle} isLoading={isStartingCycle} className="w-full">
                    Comenzar Ciclo
                  </Button>
                </div>
              )}

              {!activeCycle && lote.current_status !== 'available' && (
                <p className="text-xs text-slate-400">
                  Este lote debe estar disponible para poder comenzar un nuevo ciclo.
                </p>
              )}

              {activeCycle && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Ciclo iniciado el {formatDate(activeCycle.started_at)}. Fase actual:{' '}
                    <span className="font-semibold text-slate-600">{activeCycle.current_phase?.phase?.name ?? '—'}</span>
                  </p>
                  <ul className="space-y-1.5">
                    {(activeCycle.phases ?? []).map(phase => {
                      const isCurrent = phase.id === activeCycle.current_phase?.id;
                      return (
                        <li
                          key={phase.id}
                          className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${
                            isCurrent ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: phase.phase?.color_reference || '#94a3b8' }}
                            />
                            <span className={isCurrent ? 'font-semibold text-emerald-700' : 'text-slate-600'}>
                              {phase.phase?.name}
                            </span>
                          </span>
                          <span className="text-slate-400">
                            {formatDate(phase.planned_start_date)} – {formatDate(phase.planned_end_date)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {isInDespacho && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                      <p className="text-xs font-semibold text-amber-800">
                        Este lote llegó a la fase de Despacho.
                      </p>
                      <p className="text-xs text-amber-700">
                        Al cerrar el ciclo el lote vuelve a estar disponible de inmediato. La cantidad
                        real despachada se reporta después, por separado, desde Reportes.
                      </p>
                      <Button type="button" variant="primary" onClick={onTerminateDispatch} isLoading={isStartingCycle} className="w-full">
                        Cerrar Ciclo (liberar lote)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </AccordionSection>

            <AccordionSection id="capacidad" title="Corregir capacidad" isOpen={openSection === 'capacidad'} onToggle={setOpenSection}>
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Rango permitido: {min.toLocaleString('es')} – {max.toLocaleString('es')} plántulas (máx. 15% sobre el cálculo por geometría).
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={capacityInput}
                    onChange={e => setCapacityInput(Number(e.target.value))}
                    min={1}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <Button type="button" variant="secondary" onClick={onUpdateCapacity} isLoading={isSaving}>
                    Corregir
                  </Button>
                </div>
              </div>
            </AccordionSection>

            <AccordionSection id="configuracion" title="Zona de configuración" isOpen={openSection === 'configuracion'} onToggle={setOpenSection}>
              <div className="space-y-2">
                {lote.current_status === 'available' && (
                  <Button type="button" variant="secondary" onClick={onSetInactive} className="w-full text-slate-600">
                    Marcar como inactivo
                  </Button>
                )}
                {lote.current_status === 'occupied' && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Este lote está en producción — no se puede inactivar ni eliminar hasta que termine su ciclo.
                  </p>
                )}
                {lote.current_status === 'inactive' && (
                  <>
                    <Button type="button" variant="secondary" onClick={onSetAvailable} className="w-full">
                      Reactivar lote
                    </Button>
                    <Button type="button" variant="danger" onClick={onDelete} className="w-full">
                      Eliminar lote
                    </Button>
                  </>
                )}
              </div>
            </AccordionSection>
          </div>

          <div className="border-t border-slate-100 p-6 bg-slate-50 flex justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
