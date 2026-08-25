import React, { useEffect } from 'react';
import { useInventoryNav } from '../hooks/useInventoryNav';
import ToolsPage from '../pages/ToolsPage';
import SuppliesPage from '../pages/SuppliesPage';
import MovementsPage from '../pages/MovementsPage';
import MaintenancePage from '../pages/MaintenancePage';
import ReportsPage from '../pages/ReportsPage';
import { ScannerPage } from '../pages/ScannerPage';
import StudentsPage from '../pages/StudentsPage';

interface InventoryTabsProps {
  onTabChange?: (tabLabel: string) => void;
  /** Deep-link desde el escáner universal de la barra inferior móvil (ver
   * App.tsx) — cualquier código que no sea de un lote de Seguimiento cae acá.
   * El nonce permite re-escanear el mismo código dos veces seguidas. */
  externalScanCode?: string;
  externalScanNonce?: number;
}

export const InventoryTabs: React.FC<InventoryTabsProps> = ({ onTabChange, externalScanCode, externalScanNonce }) => {
  const { activeSection, setActiveSection } = useInventoryNav();

  useEffect(() => {
    if (!onTabChange) return;
    const labels: Record<string, string> = {
      herramientas: 'Herramientas',
      insumos: 'Insumos',
      historial: 'Historial',
      mantenimiento: 'Mantenimiento',
      estudiantes: 'Estudiantes',
      reportes: 'Reportes',
    };
    onTabChange(labels[activeSection] || 'Herramientas');
  }, [activeSection, onTabChange]);

  useEffect(() => {
    if (!externalScanNonce) return;
    setActiveSection('scanner');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalScanNonce]);

  return (
    <div className="h-full animate-fade-in">
      {activeSection === 'scanner' && <ScannerPage externalCode={externalScanCode} externalNonce={externalScanNonce} />}
      {activeSection === 'herramientas' && <ToolsPage />}
      {activeSection === 'insumos' && <SuppliesPage />}
      {activeSection === 'historial' && <MovementsPage />}
      {activeSection === 'mantenimiento' && <MaintenancePage />}
      {activeSection === 'estudiantes' && <StudentsPage />}
      {activeSection === 'reportes' && <ReportsPage />}
    </div>
  );
};
