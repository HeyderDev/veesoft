import React, { useEffect } from 'react';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { usePlanningNav, planningSectionTabs } from '../hooks/usePlanningNav';
import { ResumenPage } from '../pages/ResumenPage';
import { HistorialPage } from '../pages/HistorialPage';
import { LotesPage } from '../pages/LotesPage';
import { FasesPage } from '../pages/FasesPage';

interface PlanningTabsProps {
  onTabChange?: (tabLabel: string) => void;
}

/**
 * El vivero activo es global (ver ActiveViveroContext) — este módulo ya no
 * pide elegir un vivero, va directo a sus secciones. La navegación (qué
 * sección) vive en PlanningNavContext, compartida con el panel del sidebar
 * (PlanningSidebarSections), única forma de cambiar de sección — no hay
 * fila de botones aquí arriba.
 */
export const PlanningTabs: React.FC<PlanningTabsProps> = ({ onTabChange }) => {
  const { activeVivero } = useActiveVivero();
  const { activeSection } = usePlanningNav();

  useEffect(() => {
    if (!onTabChange || !activeVivero) return;
    const label = planningSectionTabs.find(t => t.id === activeSection)?.label ?? '';
    // El nombre del vivero ya lo muestra el breadcrumb global (ViveroSwitcher);
    // repetirlo acá era redundante.
    onTabChange(label);
  }, [activeVivero, activeSection, onTabChange]);

  if (!activeVivero) return null;

  const renderSection = () => {
    switch (activeSection) {
      case 'resumen': return <ResumenPage viveroId={activeVivero.id} />;
      case 'lotes': return <LotesPage viveroId={activeVivero.id} />;
      case 'fases': return <FasesPage viveroId={activeVivero.id} />;
      case 'historial': return <HistorialPage />;
      default: return <ResumenPage viveroId={activeVivero.id} />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {renderSection()}
    </div>
  );
};
