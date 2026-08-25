import React, { createContext, useContext, useState } from 'react';
import { Handshake, Package, type LucideIcon } from 'lucide-react';

export type LogisticsSection = 'suppliers' | 'purchases';

export const logisticsSectionTabs: { id: LogisticsSection; label: string; icon: LucideIcon }[] = [
  { id: 'suppliers', label: 'Proveedores', icon: Handshake },
  { id: 'purchases', label: 'Compras', icon: Package },
];

interface LogisticsNavValue {
  activeSection: LogisticsSection;
  setActiveSection: (section: LogisticsSection) => void;
}

const LogisticsNavContext = createContext<LogisticsNavValue | undefined>(undefined);

/**
 * Comparte la sección activa entre `LogisticsSidebarSections` (panel del Sidebar) y
 * `LogisticsTabs` (contenido principal) — mismo patrón que Planning/Tasks/Inventory,
 * ver `layouts/modulesRegistry.tsx`.
 */
export const LogisticsNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<LogisticsSection>('suppliers');

  return (
    <LogisticsNavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </LogisticsNavContext.Provider>
  );
};

export function useLogisticsNav(): LogisticsNavValue {
  const ctx = useContext(LogisticsNavContext);
  if (!ctx) throw new Error('useLogisticsNav debe usarse dentro de <LogisticsNavProvider>');
  return ctx;
}
