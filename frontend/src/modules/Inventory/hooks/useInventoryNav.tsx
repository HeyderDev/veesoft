import React, { createContext, useContext, useState } from 'react';

export type InventorySection = 'dashboard' | 'herramientas' | 'insumos' | 'historial' | 'mantenimiento' | 'reportes';

interface InventoryNavContextType {
  activeSection: InventorySection;
  setActiveSection: (s: InventorySection) => void;
}

const InventoryNavContext = createContext<InventoryNavContextType | undefined>(undefined);

export const InventoryNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<InventorySection>('dashboard');

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
