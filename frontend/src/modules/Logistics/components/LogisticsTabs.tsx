import React, { useEffect, useState } from 'react';
import { SuppliersPage } from '../pages/SuppliersPage';
import { PurchaseOrdersPage } from '../pages/PurchaseOrdersPage';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLogisticsNav, logisticsSectionTabs as sectionTabs } from '../hooks/useLogisticsNav';
import type { UnregisteredItem } from '../types';

interface LogisticsTabsProps {
  onTabChange?: (tabLabel: string) => void;
}

/**
 * Logistics no tiene navegación tipo drill-down (no hay un "elige X y luego navega sus
 * secciones" como Planning con sus viveros) — es un módulo plano de 3 pantallas. La
 * sección activa vive en `useLogisticsNav` (compartida con `LogisticsSidebarSections`
 * en el Sidebar), no en estado local — mismo patrón que Planning/Tasks/Inventory.
 */
export const LogisticsTabs: React.FC<LogisticsTabsProps> = ({ onTabChange }) => {
  const { isAdmin } = useAuth();
  const { activeSection, setActiveSection } = useLogisticsNav();
  const [catalogLinkRequest, setCatalogLinkRequest] = useState<UnregisteredItem | null>(null);

  const handleRequestCatalogLink = (item: UnregisteredItem) => {
    setCatalogLinkRequest(item);
    setActiveSection('suppliers');
  };

  useEffect(() => {
    if (!isAdmin && activeSection !== 'purchases') {
      setActiveSection('purchases');
    }
  }, [isAdmin, activeSection]);

  useEffect(() => {
    if (!onTabChange) return;
    const label = sectionTabs.find(t => t.id === activeSection)?.label ?? '';
    onTabChange(label);
  }, [activeSection, onTabChange]);

  const renderSection = () => {
    switch (activeSection) {
      case 'suppliers': return (
        <SuppliersPage
          pendingLinkItem={catalogLinkRequest}
          onLinkHandled={() => setCatalogLinkRequest(null)}
        />
      );
      case 'purchases': return (
        <PurchaseOrdersPage onRequestSupplierCatalogLink={handleRequestCatalogLink} />
      );
      default: return (
        <SuppliersPage
          pendingLinkItem={catalogLinkRequest}
          onLinkHandled={() => setCatalogLinkRequest(null)}
        />
      );
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex-1">
        {renderSection()}
      </div>
    </div>
  );
};
