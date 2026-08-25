import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../shared/context/AuthContext';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { CameraQrModal } from './CameraQrModal';
import { ClientesPage } from '../pages/ClientesPage';
import { LotesPage } from '../pages/LotesPage';
import { ReportesPage } from '../pages/ReportesPage';
import { ResumenSeguimientoPage } from '../pages/ResumenSeguimientoPage';

type TrackingSection = 'lotes' | 'resumen' | 'clientes' | 'pendientes';

const sectionTabs: { id: TrackingSection; label: string; icon: string; adminOnly?: boolean }[] = [
  { id: 'lotes', label: 'Lotes', icon: '🌱' },
  { id: 'resumen', label: 'Reportes', icon: '📊' },
  { id: 'clientes', label: 'Clientes', icon: '🧑‍🤝‍🧑' },
  { id: 'pendientes', label: 'Despachos Pendientes', icon: '📮', adminOnly: true },
];

interface TrackingTabsProps {
  onTabChange?: (tabLabel: string) => void;
}

/**
 * Módulo plano (sin drill-down por vivero, a diferencia de Planning) — Lotes
 * tiene su propio drill-down interno (lista -> movimientos de un lote).
 * "Despachos Pendientes" (ReportesPage, cola manual de ciclos despachados sin
 * reportar) vivía embebida como tab dentro de Planning — se movió acá porque
 * Planning ya no tiene esa pestaña (ver HistorialPage).
 */
export const TrackingTabs: React.FC<TrackingTabsProps> = ({ onTabChange }) => {
  const { isAdmin } = useAuth();
  const { activeVivero } = useActiveVivero();
  const [activeSection, setActiveSection] = useState<TrackingSection>('lotes');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedLotId, setScannedLotId] = useState<number | null>(null);
  const [scanNonce, setScanNonce] = useState(0);

  const visibleTabs = sectionTabs.filter(tab => !tab.adminOnly || isAdmin);

  useEffect(() => {
    if (!onTabChange) return;
    onTabChange(visibleTabs.find(t => t.id === activeSection)?.label ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, onTabChange]);

  const handleScanLot = (lotId: number) => {
    setScannedLotId(lotId);
    setScanNonce(n => n + 1);
    setActiveSection('lotes');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'lotes': return <LotesPage openLotId={scannedLotId} openLotNonce={scanNonce} />;
      case 'resumen': return <ResumenSeguimientoPage />;
      case 'clientes': return <ClientesPage />;
      case 'pendientes': return activeVivero ? <ReportesPage viveroId={activeVivero.id} /> : null;
      default: return <LotesPage />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {visibleTabs.map(tab => {
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
        <Button variant="secondary" onClick={() => setIsCameraOpen(true)}>
          📷 Escanear QR
        </Button>
      </div>
      <div className="flex-1">
        {renderSection()}
      </div>

      <CameraQrModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onScanLot={handleScanLot} />
    </div>
  );
};
