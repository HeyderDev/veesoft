import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useActiveVivero } from '../../../shared/context/ActiveViveroContext';
import { useTrackingNav, trackingSectionTabs } from '../hooks/useTrackingNav';
import { useAuth } from '../../../shared/context/AuthContext';
import { CameraQrModal } from './CameraQrModal';
import { ClientesPage } from '../pages/ClientesPage';
import { LotesPage } from '../pages/LotesPage';
import { ReportesPage } from '../pages/ReportesPage';
import { ResumenSeguimientoPage } from '../pages/ResumenSeguimientoPage';

interface TrackingTabsProps {
  onTabChange?: (tabLabel: string) => void;
  /** Deep-link desde el escáner universal de la barra inferior móvil (ver
   * App.tsx) — mismo mecanismo que ya usa el botón "Escanear QR" propio de
   * este módulo, solo que el código se decodifica fuera de este componente.
   * El nonce permite re-abrir el mismo lote dos veces seguidas. */
  externalOpenLotId?: number | null;
  externalOpenLotNonce?: number;
}

/**
 * Módulo plano (sin drill-down por vivero, a diferencia de Planning) — Lotes
 * tiene su propio drill-down interno (lista -> movimientos de un lote).
 * "Despachos Pendientes" (ReportesPage, cola manual de ciclos despachados sin
 * reportar) vivía embebida como tab dentro de Planning — se movió acá porque
 * Planning ya no tiene esa pestaña (ver HistorialPage). La navegación vive en
 * TrackingNavContext, compartida con el panel del sidebar
 * (TrackingSidebarSections) — no hay fila de botones aquí arriba.
 */
export const TrackingTabs: React.FC<TrackingTabsProps> = ({ onTabChange, externalOpenLotId, externalOpenLotNonce }) => {
  const { isAdmin } = useAuth();
  const { activeVivero } = useActiveVivero();
  const { activeSection, setActiveSection } = useTrackingNav();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedLotId, setScannedLotId] = useState<number | null>(null);
  const [scanNonce, setScanNonce] = useState(0);

  const visibleTabs = trackingSectionTabs.filter(tab => !tab.adminOnly || isAdmin);

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

  useEffect(() => {
    if (externalOpenLotId == null || !externalOpenLotNonce) return;
    handleScanLot(externalOpenLotId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpenLotNonce]);

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
      <div className="mb-6 flex justify-end">
        <Button variant="secondary" onClick={() => setIsCameraOpen(true)}>
          <Camera className="w-4 h-4 mr-2" />
          Escanear QR
        </Button>
      </div>
      <div className="flex-1">
        {renderSection()}
      </div>

      <CameraQrModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onScanLot={handleScanLot} />
    </div>
  );
};
