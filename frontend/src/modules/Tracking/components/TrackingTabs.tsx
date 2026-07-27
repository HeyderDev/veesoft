import React, { useEffect, useState } from 'react';
import { MovimientosPage } from '../pages/MovimientosPage';
import { ResumenSeguimientoPage } from '../pages/ResumenSeguimientoPage';
import { SeguimientoPage } from '../pages/SeguimientoPage';

type TrackingSection = 'seguimiento' | 'movimientos' | 'resumen';

const sectionTabs: { id: TrackingSection; label: string; icon: string }[] = [
  { id: 'seguimiento', label: 'Seguimiento', icon: '🌱' },
  { id: 'movimientos', label: 'Movimientos', icon: '🔄' },
  { id: 'resumen', label: 'Resumen', icon: '📊' },
];

interface TrackingTabsProps {
  onTabChange?: (tabLabel: string) => void;
}

/**
 * Módulo plano (sin drill-down por vivero, a diferencia de Planning) — las tres
 * secciones conviven al mismo nivel. No incluye "Reportes de Despacho"
 * (DispatchReport): esa pantalla ya vive embebida como tab dentro de Planning.
 */
export const TrackingTabs: React.FC<TrackingTabsProps> = ({ onTabChange }) => {
  const [activeSection, setActiveSection] = useState<TrackingSection>('seguimiento');

  useEffect(() => {
    if (!onTabChange) return;
    onTabChange(sectionTabs.find(t => t.id === activeSection)?.label ?? '');
  }, [activeSection, onTabChange]);

  const renderSection = () => {
    switch (activeSection) {
      case 'seguimiento': return <SeguimientoPage />;
      case 'movimientos': return <MovimientosPage />;
      case 'resumen': return <ResumenSeguimientoPage />;
      default: return <SeguimientoPage />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {sectionTabs.map(tab => {
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
