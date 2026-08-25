import React, { useEffect, useState } from 'react';
import { SuppliersPage } from '../pages/SuppliersPage';
import { PurchaseOrdersPage } from '../pages/PurchaseOrdersPage';
import { PlanningOverviewPage } from '../pages/PlanningOverviewPage';
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
      case 'planning-overview': return <PlanningOverviewPage />;
      case 'suppliers': return (
        <SuppliersPage
          pendingLinkItem={catalogLinkRequest}
          onLinkHandled={() => setCatalogLinkRequest(null)}
        />
      );
      case 'purchases': return (
        <PurchaseOrdersPage onRequestSupplierCatalogLink={handleRequestCatalogLink} />
      );
      default: return <PlanningOverviewPage />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {sectionTabs.filter(tab => isAdmin || tab.id === 'purchases').map(tab => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transform -translate-y-0.5'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1">
        {renderSection()}
      </div>
    </div>
  );
};
