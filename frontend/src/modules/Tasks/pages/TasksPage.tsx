import React from 'react';
import { ActivitiesSection } from '../components/ActivitiesSection';
import { TemplatesTab } from '../components/TemplatesTab';
import { ReportesSection } from '../components/ReportesSection';
import { useTasksNav } from '../hooks/useTasksNav';

export const TasksPage: React.FC = () => {
  const { activeSection: activeTab } = useTasksNav();

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

      {activeTab === 'activities' && <ActivitiesSection />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'reportes' && <ReportesSection />}
    </div>
  );
};
