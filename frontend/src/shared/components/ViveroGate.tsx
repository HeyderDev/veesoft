import React from 'react';
import { Sprout } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { ToastProvider } from '../../components/ui/Toast';
import { ViveroCard } from '../../modules/Planning/components/ViveroCard';
import { useViveroFormViewModel } from '../hooks/useViveroFormViewModel';
import { useActiveVivero } from '../context/ActiveViveroContext';

/**
 * Pantalla completa mostrada antes de entrar al sistema, cuando todavía no
 * hay un vivero activo (estilo Supabase: elegir o crear un "proyecto" antes
 * de ver cualquier otra pantalla). Ver ActiveViveroContext.tsx.
 */
const ViveroGateInner: React.FC = () => {
  const { viveros, isLoading, selectVivero, refreshViveros } = useActiveVivero();
  const {
    isFormOpen, form, setForm, isSaving, openCreate, closeForm, handleSave,
  } = useViveroFormViewModel(refreshViveros);

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Elige un vivero</h1>
          <p className="text-sm text-slate-500 mt-1">
            Todo el sistema se despliega según el vivero que elijas — como entrar a un proyecto.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : viveros.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Sprout className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No hay viveros registrados</h3>
            <p className="text-slate-500 mt-2 max-w-sm mb-6">
              Crea el primer vivero para empezar a usar el sistema.
            </p>
            <Button onClick={openCreate}>Crear mi primer vivero</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {viveros.map(vivero => (
                <ViveroCard key={vivero.id} vivero={vivero} onEnter={() => selectVivero(vivero.id)} />
              ))}
            </div>
            <div className="text-center">
              <Button variant="secondary" onClick={openCreate}>+ Crear otro vivero</Button>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title="Nuevo Vivero"
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
                placeholder="Ej: Vivero Central ULEAM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Locación *</label>
              <input
                value={form.location || ''}
                onChange={e => setForm({ ...form, location: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Ej: El Carmen, Manabí"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable *</label>
              <input
                value={form.responsible || ''}
                onChange={e => setForm({ ...form, responsible: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Nombre del responsable"
              />
            </div>
          </div>
          <div className="border-t border-slate-100 p-6 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeForm}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>Crear Vivero</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const ViveroGate: React.FC = () => (
  <ToastProvider>
    <ViveroGateInner />
  </ToastProvider>
);
