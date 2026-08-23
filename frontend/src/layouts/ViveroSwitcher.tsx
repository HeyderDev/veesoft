import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ToastProvider } from '../components/ui/Toast';
import { useActiveVivero } from '../shared/context/ActiveViveroContext';
import { useViveroFormViewModel } from '../shared/hooks/useViveroFormViewModel';

const ViveroSwitcherInner: React.FC = () => {
  const { activeVivero, viveros, selectVivero, refreshViveros } = useActiveVivero();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isFormOpen, form, setForm, isSaving, openCreate, closeForm, handleSave,
  } = useViveroFormViewModel(refreshViveros);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const otherViveros = viveros.filter(v => v.id !== activeVivero?.id);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-1.5 text-slate-400 font-medium hover:text-slate-600 transition-colors rounded-md px-1.5 py-0.5 -ml-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        <span>{activeVivero?.name ?? 'Vivero'}</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-30">
          <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Cambiar de vivero
          </p>
          {otherViveros.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">No hay otros viveros</p>
          ) : (
            otherViveros.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => { setIsOpen(false); selectVivero(v.id); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {v.name}
              </button>
            ))
          )}
          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              type="button"
              onClick={() => { setIsOpen(false); openCreate(); }}
              className="w-full text-left px-3 py-2 text-sm text-emerald-600 font-medium hover:bg-emerald-50"
            >
              + Crear vivero
            </button>
          </div>
        </div>
      )}

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

/**
 * Reemplaza el texto fijo "Vivero ULEAM" del breadcrumb por un selector real
 * de vivero activo. Envuelto en su propio ToastProvider porque el Header vive
 * fuera de los ToastProvider por-módulo que usa el resto de la app.
 */
export const ViveroSwitcher: React.FC = () => (
  <ToastProvider>
    <ViveroSwitcherInner />
  </ToastProvider>
);
