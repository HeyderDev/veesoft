import React from 'react';
import { useInventoryNav } from '../hooks/useInventoryNav';
import type { InventorySection } from '../hooks/useInventoryNav';

const activeClass = 'bg-emerald-50 text-emerald-700 font-medium';
const inactiveClass = 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-colors cursor-pointer';

export const InventorySidebarSections: React.FC = () => {
  const { activeSection, setActiveSection } = useInventoryNav();

  const renderLink = (id: InventorySection, label: string) => (
    <div
      onClick={() => setActiveSection(id)}
      className={`block px-3 py-2 text-sm rounded-lg ${activeSection === id ? activeClass : inactiveClass}`}
    >
      {label}
    </div>
  );

  return (
    <div className="pl-4 mt-2 space-y-1">
      {renderLink('dashboard', 'Dashboard')}
      {renderLink('scanner', 'Escáner')}
      {renderLink('herramientas', 'Herramientas')}
      {renderLink('insumos', 'Insumos')}
      {renderLink('historial', 'Historial')}
      {renderLink('mantenimiento', 'Mantenimiento')}
      {renderLink('reportes', 'Reportes')}
    </div>
  );
};

