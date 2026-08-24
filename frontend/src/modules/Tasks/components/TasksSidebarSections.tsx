import React from 'react';
import { useTasksNav } from '../hooks/useTasksNav';
import { useAuth } from '../../../shared/context/AuthContext';
import type { TaskTab } from '../types';

interface SidebarSectionItem {
  id: TaskTab;
  label: string;
  icon: string;
}

export const TasksSidebarSections: React.FC = () => {
  const { activeSection, setActiveSection } = useTasksNav();
  const { isAdmin } = useAuth();

  const sections: SidebarSectionItem[] = [
    { id: 'general', label: 'Actividades Generales', icon: '📋' },
    { id: 'lot', label: 'Actividades por Lote', icon: '🌱' },
    { id: 'templates', label: 'Plantillas de Actividad', icon: '⚙️' },
    ...(isAdmin ? [
      { id: 'history' as const, label: 'Historial', icon: '🕒' },
      { id: 'report' as const, label: 'Reporte General', icon: '📊' },
    ] : []),
  ];

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
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="text-sm">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
