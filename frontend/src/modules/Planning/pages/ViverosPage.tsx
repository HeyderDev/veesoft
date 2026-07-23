import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { SlideOver } from '../../../components/ui/SlideOver';
import { ViveroCard } from '../components/ViveroCard';
import { useViverosViewModel } from '../viewmodels/useViverosViewModel';

const metaStatusLabel: Record<string, string> = {
  not_started: 'No iniciada',
  active: 'Activa',
  completed: 'Completada',
};

export const ViverosPage: React.FC = () => {
  const {
    viveros, isLoading, currentMetaOf, enterVivero,
    isViveroFormOpen, editVivero, openCreateVivero, openEditVivero, closeViveroForm,
    viveroForm, setViveroForm, isSavingVivero, handleSaveVivero,
    isMetaFormOpen, activeVivero, openMetaConfig, closeMetaForm,
    metaForm, setMetaForm, isSavingMeta, handleSaveMeta, handleCulminarMeta, handleDeleteMeta,
  } = useViverosViewModel();

  const activeMeta = currentMetaOf(activeVivero);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Viveros</h1>
          <p className="text-sm text-slate-500 mt-1">Cada vivero mantiene una única meta de producción activa</p>
        </div>
        <Button onClick={openCreateVivero}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Vivero
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : viveros.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🌱</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No hay viveros registrados</h3>
          <p className="text-slate-500 mt-2 max-w-sm mb-6">
            Crea un vivero para empezar a planificar su meta de producción.
          </p>
          <Button onClick={openCreateVivero} variant="secondary">
            Crear mi primer vivero
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {viveros.map(vivero => (
            <ViveroCard
              key={vivero.id}
              vivero={vivero}
              meta={currentMetaOf(vivero)}
              onEditVivero={() => openEditVivero(vivero)}
              onConfigureMeta={() => openMetaConfig(vivero)}
              onEnter={() => enterVivero(vivero.id)}
            />
          ))}
        </div>
      )}

      {/* SlideOver: Vivero */}
      <SlideOver
        isOpen={isViveroFormOpen}
        onClose={closeViveroForm}
        title={editVivero ? 'Editar Vivero' : 'Nuevo Vivero'}
        subtitle="Datos básicos para identificar el vivero."
      >
        <form onSubmit={handleSaveVivero} className="flex flex-col h-full">
          <div className="flex-1 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input
                value={viveroForm.name || ''}
                onChange={e => setViveroForm({ ...viveroForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Ej: Vivero Central ULEAM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Locación *</label>
              <input
                value={viveroForm.location || ''}
                onChange={e => setViveroForm({ ...viveroForm, location: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Ej: El Carmen, Manabí"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable *</label>
              <input
                value={viveroForm.responsible || ''}
                onChange={e => setViveroForm({ ...viveroForm, responsible: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Nombre del responsable"
              />
            </div>
          </div>
          <div className="border-t border-slate-100 p-6 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeViveroForm}>Cancelar</Button>
            <Button type="submit" isLoading={isSavingVivero}>
              {editVivero ? 'Guardar Cambios' : 'Crear Vivero'}
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* SlideOver: Configuración de Meta */}
      <SlideOver
        isOpen={isMetaFormOpen}
        onClose={closeMetaForm}
        title={activeMeta ? 'Configuración de Meta' : 'Nueva Meta de Producción'}
        subtitle={activeVivero ? `Vivero: ${activeVivero.name}` : undefined}
      >
        <form onSubmit={handleSaveMeta} className="flex flex-col h-full">
          <div className="flex-1 p-6 space-y-6">
            {activeMeta && (
              <div className="flex items-center gap-2">
                <Badge variant={activeMeta.status === 'active' ? 'success' : activeMeta.status === 'completed' ? 'info' : 'neutral'}>
                  {metaStatusLabel[activeMeta.status]}
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

            {activeMeta && (
              <div className="border-t border-slate-100 pt-5 mt-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Zona de configuración</p>
                <div className="space-y-2">
                  {activeMeta.status === 'not_started' && (
                    <Button type="button" variant="secondary" onClick={handleDeleteMeta} className="w-full text-rose-600">
                      Eliminar meta
                    </Button>
                  )}
                  {activeMeta.status !== 'not_started' && (
                    <Button
                      type="button"
                      variant={activeMeta.status === 'completed' ? 'primary' : 'secondary'}
                      onClick={handleCulminarMeta}
                      className={activeMeta.status === 'completed' ? 'w-full' : 'w-full text-slate-500'}
                    >
                      {activeMeta.status === 'completed' ? '✅ Culminar Meta' : 'Culminar Meta'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-6 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeMetaForm}>Cancelar</Button>
            <Button type="submit" isLoading={isSavingMeta}>
              {activeMeta ? 'Guardar Cambios' : 'Crear Meta'}
            </Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
