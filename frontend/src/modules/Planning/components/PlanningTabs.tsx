import React, { useEffect } from 'react';
import { ReportesPage } from '../../Tracking/pages/ReportesPage';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { usePlanningNav, type PlanningSection } from '../hooks/usePlanningNav';
import { ResumenPage } from '../pages/ResumenPage';
import { ConfiguracionPage } from '../pages/ConfiguracionPage';
import { LotesPage } from '../pages/LotesPage';
import { FasesPage } from '../pages/FasesPage';

const sectionTabs: { id: PlanningSection; label: string; icon: string }[] = [
  { id: 'resumen', label: 'Resumen Operativo', icon: '📊' },
  { id: 'lotes', label: 'Lotes', icon: '🏗️' },
  { id: 'fases', label: 'Fases', icon: '🔄' },
  { id: 'reportes', label: 'Reportes', icon: '📋' },
  { id: 'config', label: 'Configuración', icon: '⚙️' },
];

interface PlanningTabsProps {
  onTabChange?: (tabLabel: string) => void;
}

/**
 * El vivero activo es global (ver ActiveViveroContext) — este módulo ya no
 * pide elegir un vivero, va directo a sus secciones. La navegación (qué
 * sección) vive en PlanningNavContext, compartida con el panel del sidebar
 * (PlanningSidebarSections) para que ambos queden sincronizados.
 */
export const PlanningTabs: React.FC<PlanningTabsProps> = ({ onTabChange }) => {
  const { activeVivero } = useActiveVivero();
  const { activeSection, setActiveSection } = usePlanningNav();

  useEffect(() => {
    if (!onTabChange || !activeVivero) return;
    const label = sectionTabs.find(t => t.id === activeSection)?.label ?? '';
    onTabChange(`${activeVivero.name} · ${label}`);
  }, [activeVivero, activeSection, onTabChange]);

  if (!activeVivero) return null;

  const renderSection = () => {
    switch (activeSection) {
      case 'resumen': return <ResumenPage viveroId={activeVivero.id} />;
      case 'lotes': return <LotesPage viveroId={activeVivero.id} />;
      case 'fases': return <FasesPage viveroId={activeVivero.id} />;
      case 'reportes': return <ReportesPage viveroId={activeVivero.id} />;
      case 'config': return <ConfiguracionPage />;
      default: return <ResumenPage viveroId={activeVivero.id} />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {sectionTabs.map(tab => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transform -translate-y-0.5'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1">
        {renderSection()}
      </div>
    </div>
  );
};
