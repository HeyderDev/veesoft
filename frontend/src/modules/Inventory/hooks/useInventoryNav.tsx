import React, { createContext, useContext, useState } from 'react';
import { BarChart3, GraduationCap, Hammer, History, Package, ScanLine, Wrench, type LucideIcon } from 'lucide-react';

export type InventorySection = 'scanner' | 'herramientas' | 'insumos' | 'historial' | 'mantenimiento' | 'reportes' | 'estudiantes';

export const inventorySectionTabs: { id: InventorySection; label: string; icon: LucideIcon }[] = [
  { id: 'scanner', label: 'Escáner', icon: ScanLine },
  { id: 'herramientas', label: 'Herramientas', icon: Wrench },
  { id: 'insumos', label: 'Insumos', icon: Package },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: Hammer },
  { id: 'estudiantes', label: 'Estudiantes', icon: GraduationCap },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
];

interface InventoryNavContextType {
  activeSection: InventorySection;
  setActiveSection: (s: InventorySection) => void;
}

const InventoryNavContext = createContext<InventoryNavContextType | undefined>(undefined);

export const InventoryNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<InventorySection>('herramientas');

  return (
    <InventoryNavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </InventoryNavContext.Provider>
  );
};

export const useInventoryNav = () => {
  const ctx = useContext(InventoryNavContext);
  if (!ctx) throw new Error('useInventoryNav must be used within an InventoryNavProvider');
  return ctx;
};
