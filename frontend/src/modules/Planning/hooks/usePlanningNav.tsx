import React, { createContext, useContext, useState } from 'react';

export type PlanningSection = 'resumen' | 'lotes' | 'fases' | 'historial';

interface PlanningNavValue {
  activeSection: PlanningSection;
  setActiveSection: (section: PlanningSection) => void;
}

const PlanningNavContext = createContext<PlanningNavValue | undefined>(undefined);

/**
 * Estado de navegación del módulo Planning, compartido entre el contenido principal
 * (PlanningTabs) y el panel de secciones del sidebar (PlanningSidebarSections) — ambos
 * se montan bajo este mismo Provider (ver AdminLayout.tsx). El vivero activo ya no vive
 * aquí — es un concepto global, ver shared/context/ActiveViveroContext.tsx.
 */
export const PlanningNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<PlanningSection>('resumen');

  return (
    <PlanningNavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </PlanningNavContext.Provider>
  );
};

export function usePlanningNav(): PlanningNavValue {
  const ctx = useContext(PlanningNavContext);
  if (!ctx) throw new Error('usePlanningNav debe usarse dentro de <PlanningNavProvider>');
  return ctx;
}
