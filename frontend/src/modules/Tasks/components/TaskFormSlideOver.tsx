import React, { useEffect, useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { SlideOver } from '../../../components/ui/SlideOver';
import type { 
  LotInfo,
  TaskCreateInput, 
  TaskUpdateInput 
} from '../types';
import { TaskResourcePicker } from './TaskResourcePicker';
import { tasksService } from '../services/tasksService';

// ---- Helpers de presentación ----
interface TaskFormSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  form: TaskCreateInput | TaskUpdateInput;
  setForm: (form: TaskCreateInput | TaskUpdateInput) => void;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  subtitle?: string;
  showLotSelector?: boolean;
}

export const TaskFormSlideOver: React.FC<TaskFormSlideOverProps> = ({
  isOpen, onClose, form, setForm, isSaving, onSubmit, title, subtitle, showLotSelector = false,
}) => {
  const f = form as Record<string, unknown>;
  const [lots, setLots] = useState<LotInfo[]>([]);

  useEffect(() => {
    if (showLotSelector && isOpen) {
      const loadLots = async () => {
        try {
          const res = await tasksService.getLots() as unknown as { data: LotInfo[] };
          setLots(Array.isArray(res.data) ? res.data : []);
        } catch {
          setLots([]);
        }
      };
      loadLots();
    }
  }, [showLotSelector, isOpen]);

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-100px)]">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            required
            maxLength={150}
            value={(f.title as string) ?? ''}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="ej. Aplicar fungicida en lote norte"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Selector de Lote (solo si showLotSelector) */}
        {showLotSelector && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lote asignado
            </label>
            <select
              id="task-lot"
              value={(f.lot_id as string) ?? ''}
              onChange={e => setForm({ ...form, lot_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            >
              <option value="">Sin lote (actividad general)</option>
              {lots.map(lot => (
                <option key={lot.id} value={lot.id}>
                  {lot.name} ({lot.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Selecciona un lote para asignar esta actividad a un lote específico.</p>
          </div>
        )}

        {/* Fecha planificada */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Fecha planificada <span className="text-red-500">*</span>
          </label>
          <input
            id="task-planned-date"
            type="date"
            required
            value={(f.planned_date as string) ?? ''}
            onChange={e => setForm({ ...form, planned_date: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
          <select
            id="task-priority"
            value={(f.priority as string) ?? ''}
            onChange={e => setForm({ ...form, priority: (e.target.value || null) as import('../types').PrioridadTarea | null })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="">Sin prioridad</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <textarea
            id="task-description"
            rows={3}
            value={(f.description as string) ?? ''}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Detalle de la actividad..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
          />
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
          <textarea
            id="task-observations"
            rows={2}
            value={(f.observations as string) ?? ''}
            onChange={e => setForm({ ...form, observations: e.target.value })}
            placeholder="Notas adicionales..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
          />
        </div>

        {/* Herramientas e Insumos */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Herramientas e Insumos</label>
          <TaskResourcePicker
            selectedResources={(f.resources as { type: 'tool' | 'supply', id: number }[]) ?? []}
            onChange={resources => setForm({ ...form, resources })}
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSaving} className="flex-1">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </SlideOver>
  );
};

// ---- Badge de estado ----
interface StatusBadgeProps {
  status: 'pending' | 'completed';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const map: Record<typeof status, { label: string; variant: 'warning' | 'success' }> = {
    pending: { label: 'Pendiente', variant: 'warning' },
    completed: { label: 'Realizada', variant: 'success' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'warning' as const };
  return <Badge variant={variant}>{label}</Badge>;
};

// ---- Badge de prioridad ----
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | null | undefined;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  if (!priority) return null;
  const map: Record<'low' | 'medium' | 'high', { label: string; variant: 'neutral' | 'warning' | 'danger' }> = {
    low: { label: '↓ Baja', variant: 'neutral' },
    medium: { label: '→ Media', variant: 'warning' },
    high: { label: '↑ Alta', variant: 'danger' },
  };
  const { label, variant } = map[priority];
  return <Badge variant={variant}>{label}</Badge>;
};
