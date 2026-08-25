import React from 'react';
import { usePlanningNav, type PlanningSection } from '../hooks/usePlanningNav';

const sections: { id: PlanningSection; label: string; icon: string }[] = [
  { id: 'resumen', label: 'Resumen Operativo', icon: '📊' },
  { id: 'lotes', label: 'Lotes', icon: '🏗️' },
  { id: 'fases', label: 'Fases', icon: '🔄' },
  { id: 'historial', label: 'Historial', icon: '🗂️' },
];

/**
 * Panel que el Sidebar compartido (frontend/src/layouts/Sidebar.tsx) monta debajo de
 * la entrada "Planificación" cuando ese módulo está activo — las secciones del vivero
 * activo (una sola vía activa a la vez, controlada por PlanningNavContext, el mismo
 * estado que usa el contenido principal). El vivero en sí ya es global, se elige y se
 * cambia desde el selector de las migas de pan (ver layouts/ViveroSwitcher.tsx).
 */
export const PlanningSidebarSections: React.FC = () => {
  const { activeSection, setActiveSection } = usePlanningNav();

  return (
    <div className="pl-4 pr-2 mt-1 space-y-1">
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
