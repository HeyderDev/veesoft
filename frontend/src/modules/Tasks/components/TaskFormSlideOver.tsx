import React, { useEffect, useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { SlideOver } from '../../../components/ui/SlideOver';
import type {
  LotInfo,
  TaskCreateInput,
  TaskTemplateCreateInput,
  TaskUpdateInput,
  ActivityType
} from '../types';
import { TaskResourcePicker } from './TaskResourcePicker';
import { tasksService } from '../services/tasksService';

// ---- Helpers de presentación ----
interface TaskFormSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  /** 'template': formulario mínimo (plantilla + fecha). 'free': formulario completo. */
  mode: 'template' | 'free';
  form: TaskTemplateCreateInput | TaskCreateInput | TaskUpdateInput;
  setForm: (form: any) => void;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  subtitle?: string;
  showLotSelector?: boolean;
  users?: { id: number; name: string }[];
}

export const TaskFormSlideOver: React.FC<TaskFormSlideOverProps> = ({
  isOpen, onClose, mode, form, setForm, isSaving, onSubmit, title, subtitle, showLotSelector = false, users = [],
}) => {
  const f = form as Record<string, unknown>;
  const [lots, setLots] = useState<LotInfo[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (showLotSelector) {
        tasksService.getLots()
          .then(res => setLots(Array.isArray((res as any).data) ? (res as any).data : []))
          .catch(() => setLots([]));
      }

      if (mode === 'template') {
        tasksService.getActivityTypes()
          .then(res => setActivityTypes(Array.isArray(res) ? res : (res as any).data || []))
          .catch(() => setActivityTypes([]));
      }
    }
  }, [showLotSelector, isOpen, mode]);

  const selectedTemplate = activityTypes.find(a => a.id === f.activity_type_id);

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-100px)]">
        {mode === 'template' ? (
          <>
            {/* Plantilla */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Plantilla de Actividad <span className="text-red-500">*</span>
              </label>
              <select
                id="task-activity-type"
                required
                value={(f.activity_type_id as number) || ''}
                onChange={e => setForm({ ...form, activity_type_id: e.target.value ? Number(e.target.value) : 0 })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                <option value="">Selecciona una plantilla...</option>
                {activityTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} {type.is_system ? '(Sistema)' : ''}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Se copiarán automáticamente el título, la descripción, la prioridad y las herramientas/insumos de la plantilla. Podrás editarlos luego en la actividad ya creada.
                </p>
              )}
            </div>

            {/* Selector de Lote */}
            {showLotSelector && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lote asignado</label>
                <select
                  id="task-lot"
                  value={(f.lot_id as string) ?? ''}
                  onChange={e => setForm({ ...form, lot_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                >
                  <option value="">Sin lote (actividad general)</option>
                  {lots.map(lot => (
                    <option key={lot.id} value={lot.id}>{lot.name} ({lot.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Asignado a */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asignado a</label>
              <select
                value={(f.assigned_to as string) ?? ''}
                onChange={e => setForm({ ...form, assigned_to: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                <option value="">Sin asignar</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

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
          </>
        ) : (
          <>
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

            {/* Asignado a */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asignado a</label>
              <select
                value={(f.assigned_to as string) ?? ''}
                onChange={e => setForm({ ...form, assigned_to: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                <option value="">Sin asignar</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

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
          </>
        )}

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
