import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { CameraQrModal } from './CameraQrModal';
import { ClientesPage } from '../pages/ClientesPage';
import { LotesPage } from '../pages/LotesPage';
import { ResumenSeguimientoPage } from '../pages/ResumenSeguimientoPage';

type TrackingSection = 'lotes' | 'resumen' | 'clientes';

const sectionTabs: { id: TrackingSection; label: string; icon: string }[] = [
  { id: 'lotes', label: 'Lotes', icon: '🌱' },
  { id: 'resumen', label: 'Reportes', icon: '📊' },
  { id: 'clientes', label: 'Clientes', icon: '🧑‍🤝‍🧑' },
];

interface TrackingTabsProps {
  onTabChange?: (tabLabel: string) => void;
}

/**
 * Módulo plano (sin drill-down por vivero, a diferencia de Planning) — Lotes
 * tiene su propio drill-down interno (lista -> movimientos de un lote). No
 * incluye "Reportes de Despacho" (DispatchReport): esa pantalla ya vive
 * embebida como tab dentro de Planning.
 */
export const TrackingTabs: React.FC<TrackingTabsProps> = ({ onTabChange }) => {
  const [activeSection, setActiveSection] = useState<TrackingSection>('lotes');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedLotId, setScannedLotId] = useState<number | null>(null);
  const [scanNonce, setScanNonce] = useState(0);

  useEffect(() => {
    if (!onTabChange) return;
    onTabChange(sectionTabs.find(t => t.id === activeSection)?.label ?? '');
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
      default: return <LotesPage />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
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
