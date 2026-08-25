import React from 'react';
import { ActivitiesSection } from '../components/ActivitiesSection';
import { TemplatesTab } from '../components/TemplatesTab';
import { ReportesSection } from '../components/ReportesSection';
import { useTasksNav } from '../hooks/useTasksNav';
import type { TaskTab } from '../types';
import { useAuth } from '../../../shared/context/AuthContext';

export const TasksPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { activeSection: activeTab, setActiveSection: setActiveTab } = useTasksNav();

  const tabs: { id: TaskTab; label: string; icon: string }[] = [
    { id: 'activities', label: 'Actividades', icon: '✅' },
    { id: 'templates', label: 'Plantillas', icon: '⚙️' },
    ...(isAdmin ? [{ id: 'reportes' as const, label: 'Reportes', icon: '📊' }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tareas y Actividades</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión integral de actividades, asignación de lotes e inventario.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'activities' && <ActivitiesSection />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'reportes' && <ReportesSection />}
    </div>
  );
};
