import React, { useEffect, useRef, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../shared/context/AuthContext';

/**
 * Reemplaza el bloque de nombre+rol y el botón de logout separado del Header
 * por un único ícono de perfil con un desplegable — mismo patrón de
 * click-outside que ya usa ViveroSwitcher.tsx.
 */
export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        title={user ? `${user.first_name} ${user.last_name}` : 'Perfil'}
        className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm hover:shadow-md transition-shadow"
      >
        <User className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-30">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700 leading-tight truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-400">{user?.role?.name}</p>
          </div>
          <button
            type="button"
            onClick={() => { setIsOpen(false); logout(); }}
            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 mt-1"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};
