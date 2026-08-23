import React, { useEffect } from 'react';
import { useInventoryNav } from '../hooks/useInventoryNav';
import InventoryDashboardPage from '../pages/InventoryDashboardPage';
import ToolsPage from '../pages/ToolsPage';
import SuppliesPage from '../pages/SuppliesPage';
import MovementsPage from '../pages/MovementsPage';
import MaintenancePage from '../pages/MaintenancePage';
import ReportsPage from '../pages/ReportsPage';
import { ScannerPage } from '../pages/ScannerPage';

interface InventoryTabsProps {
  onTabChange?: (tabLabel: string) => void;
}

export const InventoryTabs: React.FC<InventoryTabsProps> = ({ onTabChange }) => {
  const { activeSection } = useInventoryNav();

  useEffect(() => {
    if (!onTabChange) return;
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      herramientas: 'Herramientas',
      insumos: 'Insumos',
      historial: 'Historial',
      mantenimiento: 'Mantenimiento',
      reportes: 'Reportes',
    };
    onTabChange(labels[activeSection] || 'Dashboard');
  }, [activeSection, onTabChange]);

  return (
    <div className="h-full animate-fade-in">
      {activeSection === 'dashboard' && <InventoryDashboardPage />}
      {activeSection === 'scanner' && <ScannerPage />}
      {activeSection === 'herramientas' && <ToolsPage />}
      {activeSection === 'insumos' && <SuppliesPage />}
      {activeSection === 'historial' && <MovementsPage />}
      {activeSection === 'mantenimiento' && <MaintenancePage />}
      {activeSection === 'reportes' && <ReportsPage />}
    </div>
  );
};
