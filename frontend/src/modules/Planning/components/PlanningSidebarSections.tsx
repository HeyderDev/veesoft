import React from 'react';
import { usePlanningNav, type PlanningSection } from '../hooks/usePlanningNav';

const sections: { id: PlanningSection; label: string; icon: string }[] = [
  { id: 'resumen', label: 'Resumen Operativo', icon: '📊' },
  { id: 'lotes', label: 'Lotes', icon: '🏗️' },
  { id: 'fases', label: 'Fases', icon: '🔄' },
  { id: 'reportes', label: 'Reportes', icon: '📋' },
];

/**
 * Panel que el Sidebar compartido (frontend/src/layouts/Sidebar.tsx) monta debajo de
 * la entrada "Planificación" cuando ese módulo está activo. Primero lista los
 * Viveros; al entrar a uno, despliega sus 3 secciones (una sola vía activa a la vez,
 * controlada por PlanningNavContext — el mismo estado que usa el contenido principal).
 */
export const PlanningSidebarSections: React.FC = () => {
  const { viveros, isLoadingViveros, enteredViveroId, setEnteredViveroId, activeSection, setActiveSection } = usePlanningNav();

  if (isLoadingViveros) {
    return <p className="px-4 py-2 text-[11px] text-slate-500">Cargando viveros…</p>;
  }

  if (viveros.length === 0) {
    return <p className="px-4 py-2 text-[11px] text-slate-500">Sin viveros todavía</p>;
  }

  const enteredVivero = viveros.find(v => v.id === enteredViveroId);

  if (!enteredVivero) {
    return (
      <ul className="space-y-0.5 pl-4 pr-2 mt-1">
        {viveros.map(vivero => (
          <li key={vivero.id}>
            <button
              type="button"
              onClick={() => setEnteredViveroId(vivero.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors truncate"
            >
              🌱 <span className="truncate">{vivero.name}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="pl-4 pr-2 mt-1 space-y-1">
      <button
        type="button"
        onClick={() => setEnteredViveroId(null)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-400 hover:bg-slate-800/60 transition-colors"
      >
        ← Todos los viveros
      </button>
      <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 truncate">
        {enteredVivero.name}
      </p>
      <ul className="space-y-0.5">
        {sections.map(section => {
          const isActive = activeSection === section.id;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {section.icon} {section.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
