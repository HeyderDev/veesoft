import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Settings, X } from 'lucide-react';
import { useAuth } from '../shared/context/AuthContext';

interface MobileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings: () => void;
}

/**
 * Panel accesible desde el botón derecho de MobileBottomNav — consolida en
 * mobile lo que en escritorio está repartido entre el Sidebar ("Configuración",
 * ver Sidebar.tsx) y el Header (logout, ver UserMenu.tsx).
 */
export const MobileSettingsSheet: React.FC<MobileSettingsSheetProps> = ({ isOpen, onClose, onNavigateToSettings }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-20 right-4 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-400">{user?.role?.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => { onClose(); onNavigateToSettings(); }}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </button>
        <button
          type="button"
          onClick={() => { onClose(); logout(); }}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>,
    document.body,
  );
};
