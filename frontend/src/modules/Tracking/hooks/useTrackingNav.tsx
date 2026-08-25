import React, { createContext, useContext, useState } from 'react';
import { BarChart3, PackageCheck, Sprout, Users, type LucideIcon } from 'lucide-react';

export type TrackingSection = 'lotes' | 'resumen' | 'clientes' | 'pendientes';

export const trackingSectionTabs: { id: TrackingSection; label: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { id: 'lotes', label: 'Lotes', icon: Sprout },
  { id: 'resumen', label: 'Reportes', icon: BarChart3 },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'pendientes', label: 'Despachos Pendientes', icon: PackageCheck, adminOnly: true },
];

interface TrackingNavValue {
  activeSection: TrackingSection;
  setActiveSection: (section: TrackingSection) => void;
}

const TrackingNavContext = createContext<TrackingNavValue | undefined>(undefined);

/**
 * Comparte la sección activa entre `TrackingSidebarSections` (panel del Sidebar) y
 * `TrackingTabs` (contenido principal) — mismo patrón que Planning/Tasks/Logistics/
 * Inventory (ver layouts/modulesRegistry.tsx). Antes Tracking manejaba su sección
 * activa con un useState local dentro de TrackingTabs, sin sidebar propio.
 */
export const TrackingNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<TrackingSection>('lotes');

  return (
    <TrackingNavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </TrackingNavContext.Provider>
  );
};

export function useTrackingNav(): TrackingNavValue {
  const ctx = useContext(TrackingNavContext);
  if (!ctx) throw new Error('useTrackingNav debe usarse dentro de <TrackingNavProvider>');
  return ctx;
}
