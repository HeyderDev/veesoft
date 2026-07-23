import React, { useEffect } from 'react';
import { ReportesPage } from '../../Tracking/pages/ReportesPage';
import { usePlanningNav, type PlanningSection } from '../hooks/usePlanningNav';
import { ResumenPage } from '../pages/ResumenPage';
import { ViverosPage } from '../pages/ViverosPage';
import { LotesPage } from '../pages/LotesPage';
import { FasesPage } from '../pages/FasesPage';

const sectionTabs: { id: PlanningSection; label: string; icon: string }[] = [
  { id: 'resumen', label: 'Resumen Operativo', icon: '📊' },
  { id: 'lotes', label: 'Lotes', icon: '🏗️' },
  { id: 'fases', label: 'Fases', icon: '🔄' },
  { id: 'reportes', label: 'Reportes', icon: '📋' },
];

interface PlanningTabsProps {
  onTabChange?: (tabLabel: string) => void;
}

/**
 * Primera vista del módulo es siempre Viveros — Resumen/Lotes/Fases solo existen
 * dentro de un vivero ya "entrado" (ver usePlanningNav). La navegación (qué vivero,
 * qué sección) vive en PlanningNavContext, compartida con el panel del sidebar
 * (PlanningSidebarSections) para que ambos queden sincronizados.
 */
export const PlanningTabs: React.FC<PlanningTabsProps> = ({ onTabChange }) => {
  const { viveros, enteredViveroId, setEnteredViveroId, activeSection, setActiveSection } = usePlanningNav();
  const enteredVivero = viveros.find(v => v.id === enteredViveroId);

  useEffect(() => {
    if (!onTabChange) return;
    if (!enteredVivero) {
      onTabChange('Viveros');
      return;
    }
    const label = sectionTabs.find(t => t.id === activeSection)?.label ?? '';
    onTabChange(`${enteredVivero.name} · ${label}`);
  }, [enteredVivero, activeSection, onTabChange]);

  if (!enteredVivero) {
    return (
      <div className="animate-fade-in">
        <ViverosPage />
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'resumen': return <ResumenPage viveroId={enteredVivero.id} />;
      case 'lotes': return <LotesPage viveroId={enteredVivero.id} />;
      case 'fases': return <FasesPage viveroId={enteredVivero.id} />;
      case 'reportes': return <ReportesPage viveroId={enteredVivero.id} />;
      default: return <ResumenPage viveroId={enteredVivero.id} />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEnteredViveroId(null)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 transition-colors"
        >
          ← Viveros
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700 mr-2">{enteredVivero.name}</span>
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
