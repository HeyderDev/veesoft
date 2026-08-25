import React from 'react';
import { Camera, Menu, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenDrawer: () => void;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
}

/**
 * Barra inferior exclusiva de mobile (lg:hidden) — 3 botones: hamburguesa
 * (abre MobileDrawer con el Sidebar), cámara/escáner central elevado
 * (abre UniversalScannerModal) y configuración (abre MobileSettingsSheet).
 * Se monta desde AdminLayout.tsx, que es quien posee el estado de cada panel.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenDrawer, onOpenScanner, onOpenSettings }) => {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative flex items-center justify-between px-8 h-16">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-white transition-colors w-14 h-full"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <button
            type="button"
            onClick={onOpenScanner}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 border-4 border-slate-50 hover:from-emerald-400 hover:to-emerald-500 transition-colors"
            aria-label="Escanear código QR"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-white transition-colors w-14 h-full"
          aria-label="Configuración"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
};
