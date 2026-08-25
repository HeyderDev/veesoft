import React from 'react';
import { Home, MapPin, Target, User } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { useViveroFormViewModel } from '../../../shared/hooks/useViveroFormViewModel';
import { useViveroConfigViewModel } from '../viewmodels/useViveroConfigViewModel';
import type { EstadoMeta } from '../../Planning/types';

const metaStatusLabel: Record<EstadoMeta, string> = {
  not_started: 'No iniciada',
  active: 'Activa',
  completed: 'Completada',
};

function culminarMessage(target: number, produced: number): string {
  if (target <= 0) return 'Esta meta no tiene un objetivo válido para comparar.';
  const pct = ((produced - target) / target) * 100;
  if (pct === 0) return 'La meta se cumplió exactamente según lo proyectado.';
  if (pct < 0) return `La meta tiene un déficit de ${Math.round(Math.abs(pct))}% con respecto a lo proyectado.`;
  return `La meta cumple con un ${Math.round(pct)}% de efectividad sobre lo proyectado.`;
}

/**
 * Configuración global (Info del Vivero + Meta de Producción) — vive en el
 * sidebar global, separada de los módulos (ver layouts/Sidebar.tsx). Antes
 * era una pestaña dentro de Planificación.
 */
export const ConfiguracionPage: React.FC = () => {
  const { activeVivero, refreshViveros } = useActiveVivero();

  const {
    isFormOpen, form, setForm, isSaving, openEdit, closeForm, handleSave,
  } = useViveroFormViewModel(refreshViveros);

  const vivero = activeVivero!;
  const {
    currentMeta, isMetaFormOpen, openMetaConfig, closeMetaForm,
    metaForm, setMetaForm, isSavingMeta, handleSaveMeta,
    culminarStep, openCulminar, closeCulminar, continueCulminar, backToCulminarPreview, isCulminando, confirmCulminar,
    isDeleteConfirmOpen, openDeleteConfirm, closeDeleteConfirm, isDeleting, confirmDelete,
  } = useViveroConfigViewModel(vivero, refreshViveros);

  const target = currentMeta?.target_seedlings ?? 0;
  const produced = currentMeta?.produced_seedlings ?? 0;
  const progressPct = target > 0 ? Math.min(100, Math.round((produced / target) * 100)) : 0;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight text-center">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1 text-center">Información del vivero y su meta de producción.</p>
      </div>

      {/* Card: Información del Vivero */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200 shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">Información del Vivero</h2>
              <p className="text-xs text-slate-400">Datos básicos de identificación</p>
            </div>
          </div>

          <div className="space-y-2 pl-1">
            <p className="text-lg font-semibold text-slate-800">{vivero.name}</p>
            <p className="text-sm text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {vivero.location}</p>
            <p className="text-sm text-slate-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {vivero.responsible}</p>
          </div>

          <Button variant="secondary" onClick={() => openEdit(vivero)} className="w-full">
            Editar Información
          </Button>
        </div>
      </div>

      {/* Card: Meta de Producción */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">Meta de Producción</h2>
              <p className="text-xs text-slate-400">Objetivo de plántulas del ciclo actual</p>
            </div>
          </div>

          {currentMeta ? (
            <div className="space-y-4 pl-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 truncate">{currentMeta.title}</p>
                <Badge variant={currentMeta.status === 'active' ? 'success' : currentMeta.status === 'completed' ? 'info' : 'neutral'}>
                  {metaStatusLabel[currentMeta.status]}
                </Badge>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-xl font-bold text-slate-800">{produced.toLocaleString('es')}</span>
                  <span className="text-sm text-slate-400">/ {target.toLocaleString('es')} plántulas</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <Button variant="secondary" onClick={openMetaConfig} className="w-full">Configurar Meta</Button>
            </div>
          ) : (
            <div className="text-center py-2 pl-1">
              <p className="text-sm text-slate-400 mb-3">Este vivero no tiene una meta en curso.</p>
              <Button onClick={openMetaConfig} className="w-full">Nueva Meta</Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: editar vivero */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title="Editar Vivero"
        subtitle="Datos básicos para identificar el vivero."
        maxWidthClassName="max-w-md"
      >
        <form onSubmit={handleSave} className="flex flex-col h-full">
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Locación *</label>
              <input
                value={form.location || ''}
                onChange={e => setForm({ ...form, location: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable *</label>
              <input
                value={form.responsible || ''}
                onChange={e => setForm({ ...form, responsible: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="border-t border-slate-100 p-6 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeForm}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>Guardar Cambios</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: configuración de meta */}
      <Modal
        isOpen={isMetaFormOpen}
        onClose={closeMetaForm}
        title={currentMeta ? 'Configuración de Meta' : 'Nueva Meta de Producción'}
        subtitle={`Vivero: ${vivero.name}`}
        maxWidthClassName="max-w-lg"
      >
        <form onSubmit={handleSaveMeta} className="flex flex-col h-full">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {currentMeta && (
              <div className="flex items-center gap-2">
                <Badge variant={currentMeta.status === 'active' ? 'success' : currentMeta.status === 'completed' ? 'info' : 'neutral'}>
                  {metaStatusLabel[currentMeta.status]}
                </Badge>
                <span className="text-xs text-slate-400">El estado lo calcula el sistema automáticamente</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la meta *</label>
              <input
                value={metaForm.title || ''}
                onChange={e => setMetaForm({ ...metaForm, title: e.target.value })}
                required
                disabled={!!currentMeta && currentMeta.status === 'completed' && !!currentMeta.finished_at}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="Ej: Producción Anual 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea
                value={metaForm.description || ''}
                onChange={e => setMetaForm({ ...metaForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plántulas a producir (Objetivo) *</label>
              <input
                type="number"
                value={metaForm.target_seedlings || ''}
                onChange={e => setMetaForm({ ...metaForm, target_seedlings: Number(e.target.value) })}
                min={1}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            {currentMeta && (
              <div className="border-t border-slate-100 pt-5 mt-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Zona de configuración</p>
                <div className="space-y-2">
                  {currentMeta.status === 'not_started' && (
                    <Button type="button" variant="secondary" onClick={openDeleteConfirm} className="w-full text-rose-600">
                      Eliminar meta
                    </Button>
                  )}
                  {currentMeta.status !== 'not_started' && !currentMeta.finished_at && (
                    <Button type="button" variant="primary" onClick={openCulminar} className="w-full">
                      Culminar Meta
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-6 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeMetaForm}>Cancelar</Button>
            <Button type="submit" isLoading={isSavingMeta}>
              {currentMeta ? 'Guardar Cambios' : 'Crear Meta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Culminar meta — paso 1 (% vs proyectado) / paso 2 (confirmación final) */}
      <Modal
        isOpen={culminarStep !== null}
        onClose={closeCulminar}
        title={culminarStep === 'preview' ? 'Culminar Meta' : 'Confirmar Culminación'}
        subtitle={currentMeta?.title}
        maxWidthClassName="max-w-sm"
      >
        <div className="p-6 space-y-4">
          {culminarStep === 'preview' ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800">{produced.toLocaleString('es')}</span>
                <span className="text-sm text-slate-400">/ {target.toLocaleString('es')} plántulas</span>
              </div>
              <p className="text-sm text-slate-600">{culminarMessage(target, produced)}</p>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1" variant="primary" onClick={continueCulminar}>Continuar</Button>
                <Button variant="secondary" className="flex-1" onClick={closeCulminar}>Cancelar</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                ¿Confirmas que quieres culminar la meta <strong>"{currentMeta?.title}"</strong>? Esta acción no se puede deshacer — el historial de lotes y actividades de esta meta queda disponible en Historial, y el vivero podrá crear una meta nueva.
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={backToCulminarPreview}>Volver</Button>
                <Button className="flex-1" variant="primary" disabled={isCulminando} onClick={confirmCulminar}>
                  {isCulminando ? 'Guardando...' : 'Confirmar Culminación'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal: Confirmar eliminar meta */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={closeDeleteConfirm}
        title="Eliminar Meta"
        maxWidthClassName="max-w-sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">¿Estás seguro de que deseas eliminar esta meta? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" disabled={isDeleting} onClick={confirmDelete}>
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={closeDeleteConfirm}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
