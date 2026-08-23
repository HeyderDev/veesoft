import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { useViveroFormViewModel } from '../../../shared/hooks/useViveroFormViewModel';
import { useViveroConfigViewModel } from '../viewmodels/useViveroConfigViewModel';
import type { EstadoMeta } from '../types';

const metaStatusLabel: Record<EstadoMeta, string> = {
  not_started: 'No iniciada',
  active: 'Activa',
  completed: 'Completada',
};

/**
 * Edición del vivero activo (datos básicos + meta de producción). Reemplaza
 * el rol de "gestión" que antes cumplía ViverosPage — elegir/crear un vivero
 * ahora vive en ViveroGate y en el selector de las migas de pan.
 */
export const ConfiguracionPage: React.FC = () => {
  const { activeVivero, refreshViveros } = useActiveVivero();

  const {
    isFormOpen, form, setForm, isSaving, openEdit, closeForm, handleSave,
  } = useViveroFormViewModel(refreshViveros);

  const vivero = activeVivero!;
  const {
    currentMeta, isMetaFormOpen, openMetaConfig, closeMetaForm,
    metaForm, setMetaForm, isSavingMeta, handleSaveMeta, handleCulminarMeta, handleDeleteMeta,
  } = useViveroConfigViewModel(vivero, refreshViveros);

  return (
    <div className="space-y-6 animate-fade-in pb-8 max-w-2xl">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{vivero.name}</h2>
            <p className="text-xs text-slate-500 mt-1">📍 {vivero.location}</p>
            <p className="text-xs text-slate-500">👤 {vivero.responsible}</p>
          </div>
          <Button variant="secondary" onClick={() => openEdit(vivero)}>Editar</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Meta de producción</h3>
        {currentMeta ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">{currentMeta.title}</p>
              <Badge variant={currentMeta.status === 'active' ? 'success' : currentMeta.status === 'completed' ? 'info' : 'neutral'}>
                {metaStatusLabel[currentMeta.status]}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">{currentMeta.target_seedlings.toLocaleString('es')} plántulas objetivo</p>
            <Button variant="secondary" onClick={openMetaConfig} className="w-full">Configurar Meta</Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-slate-400 mb-3">Este vivero no tiene una meta en curso.</p>
            <Button onClick={openMetaConfig} className="w-full">Nueva Meta</Button>
          </div>
        )}
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
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
                    <Button type="button" variant="secondary" onClick={handleDeleteMeta} className="w-full text-rose-600">
                      Eliminar meta
                    </Button>
                  )}
                  {currentMeta.status !== 'not_started' && (
                    <Button
                      type="button"
                      variant={currentMeta.status === 'completed' ? 'primary' : 'secondary'}
                      onClick={handleCulminarMeta}
                      className={currentMeta.status === 'completed' ? 'w-full' : 'w-full text-slate-500'}
                    >
                      {currentMeta.status === 'completed' ? '✅ Culminar Meta' : 'Culminar Meta'}
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
    </div>
  );
};
