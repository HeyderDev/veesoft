import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileSettingsSheet } from './MobileSettingsSheet';
import { UniversalScannerModal } from '../shared/components/UniversalScannerModal';
import { modulesRegistry } from './modulesRegistry';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentModule: string;
  currentTab?: string;
  setCurrentModule: (module: string) => void;
  /** Decodificado del escáner universal (botón central de MobileBottomNav) —
   * el ruteo (¿lote de Seguimiento o código de Inventario?) lo decide
   * App.tsx, no este layout. */
  onUniversalScan: (decodedText: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentModule,
  currentTab,
  setCurrentModule,
  onUniversalScan,
}) => {
  // El Sidebar y el contenido comparten el mismo NavProvider (si el módulo activo
  // declara uno) — así el panel de secciones del Sidebar y la página principal
  // quedan sincronizados en el mismo estado. Ver layouts/modulesRegistry.tsx.
  const NavProvider = modulesRegistry.find(m => m.id === currentModule)?.NavProvider ?? React.Fragment;

  // Estado de los 3 paneles móviles — el Sidebar de escritorio (fixed, desde
  // `lg`) no usa nada de esto, son exclusivos de la barra inferior (lg:hidden).
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSelectModuleFromDrawer = (module: string) => {
    setCurrentModule(module);
    setIsDrawerOpen(false);
  };

  return (
    <NavProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar currentModule={currentModule} setCurrentModule={setCurrentModule} />
        <div className="flex-1 lg:ml-72 flex flex-col min-h-screen print:ml-0">
          <Header currentModule={currentModule} currentTab={currentTab} />
          <main className="flex-1 p-6 pb-24 lg:pb-6 overflow-x-hidden print:p-0 print:overflow-visible print:bg-white">
            {children}
          </main>
        </div>

        {/* Menú hamburguesa móvil — mismo Sidebar de escritorio, forzado visible
         dentro del panel deslizable con blur de fondo. */}
        <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <Sidebar forceVisible currentModule={currentModule} setCurrentModule={handleSelectModuleFromDrawer} />
        </MobileDrawer>

        <MobileBottomNav
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <UniversalScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onDecode={onUniversalScan}
        />

        <MobileSettingsSheet
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onNavigateToSettings={() => setCurrentModule('configuracion')}
        />
      </div>
    </NavProvider>
  );
};
