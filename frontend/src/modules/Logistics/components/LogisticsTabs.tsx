import React, { useEffect, useState } from 'react';
import { SuppliersPage } from '../pages/SuppliersPage';
import { PurchaseOrdersPage } from '../pages/PurchaseOrdersPage';
import { PurchaseRequestsPage } from '../pages/PurchaseRequestsPage';
import { PlanningOverviewPage } from '../pages/PlanningOverviewPage';
import { useAuth } from '../../../shared/context/AuthContext';

type LogisticsSection = 'planning-overview' | 'suppliers' | 'purchase-orders' | 'purchase-requests';

const sectionTabs: { id: LogisticsSection; label: string; icon: string }[] = [
  { id: 'planning-overview', label: 'Panorama', icon: '📊' },
  { id: 'suppliers', label: 'Proveedores', icon: '🤝' },
  { id: 'purchase-orders', label: 'Órdenes de Compra', icon: '📦' },
  { id: 'purchase-requests', label: 'Solicitudes', icon: '📝' },
];

interface LogisticsTabsProps {
  onTabChange?: (tabLabel: string) => void;
}

/**
 * Logistics no tiene navegación tipo drill-down (no hay un "elige X y luego navega sus
 * secciones" como Planning con sus viveros) — es un módulo plano de 3 pantallas.
 */
export const LogisticsTabs: React.FC<LogisticsTabsProps> = ({ onTabChange }) => {
  const { isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<LogisticsSection>(
    isAdmin ? 'planning-overview' : 'purchase-orders'
  );

  useEffect(() => {
    if (!isAdmin && activeSection !== 'purchase-orders' && activeSection !== 'purchase-requests') {
      setActiveSection('purchase-orders');
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
      case 'suppliers': return <SuppliersPage />;
      case 'purchase-orders': return <PurchaseOrdersPage />;
      case 'purchase-requests': return <PurchaseRequestsPage />;
      default: return <PlanningOverviewPage />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {sectionTabs.filter(tab => isAdmin || ['purchase-orders', 'purchase-requests'].includes(tab.id)).map(tab => {
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
