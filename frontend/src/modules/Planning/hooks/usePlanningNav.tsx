import React, { createContext, useContext, useEffect, useState } from 'react';
import { planningService } from '../services/planningService';
import type { Vivero } from '../types';

export type PlanningSection = 'resumen' | 'lotes' | 'fases' | 'reportes';

interface PlanningNavValue {
  viveros: Vivero[];
  isLoadingViveros: boolean;
  refetchViveros: () => Promise<void>;
  enteredViveroId: number | null;
  setEnteredViveroId: (id: number | null) => void;
  activeSection: PlanningSection;
  setActiveSection: (section: PlanningSection) => void;
}

const PlanningNavContext = createContext<PlanningNavValue | undefined>(undefined);

/**
 * Estado de navegación del módulo Planning, compartido entre el contenido principal
 * (PlanningTabs) y el panel de secciones del sidebar (PlanningSidebarSections) — ambos
 * se montan bajo este mismo Provider (ver AdminLayout.tsx), así que ambos ven y
 * modifican el mismo vivero "entrado" y la misma sección activa.
 */
export const PlanningNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viveros, setViveros] = useState<Vivero[]>([]);
  const [isLoadingViveros, setIsLoadingViveros] = useState(true);
  const [enteredViveroId, setEnteredViveroId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<PlanningSection>('resumen');

  const refetchViveros = async () => {
    setIsLoadingViveros(true);
    try {
      const res = await planningService.getViveros();
      setViveros(res.data || []);
    } finally {
      setIsLoadingViveros(false);
    }
  };

  useEffect(() => {
    refetchViveros();
  }, []);

  const handleSetEnteredViveroId = (id: number | null) => {
    setEnteredViveroId(id);
    setActiveSection('resumen');
  };

  return (
    <PlanningNavContext.Provider
      value={{
        viveros, isLoadingViveros, refetchViveros,
        enteredViveroId, setEnteredViveroId: handleSetEnteredViveroId,
        activeSection, setActiveSection,
      }}
    >
      {children}
    </PlanningNavContext.Provider>
  );
};

export function usePlanningNav(): PlanningNavValue {
  const ctx = useContext(PlanningNavContext);
  if (!ctx) throw new Error('usePlanningNav debe usarse dentro de <PlanningNavProvider>');
  return ctx;
}
