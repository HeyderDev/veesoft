import React from 'react';
import { modulesRegistry } from './modulesRegistry';
import { useAuth } from '../shared/context/AuthContext';

// Módulos a los que Operario no tiene acceso — el backend ya los bloquea (403),
// esto es solo para no mostrar una pestaña que va a fallar.
const ADMIN_ONLY_MODULES = ['planning'];

interface SidebarProps {
  currentModule: string;
  setCurrentModule: (module: string) => void;
}

const NavIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-base leading-none">
    {children}
  </span>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentModule, setCurrentModule }) => {
  const { isAdmin } = useAuth();
  const visibleModules = isAdmin
    ? modulesRegistry
    : modulesRegistry.filter(mod => !ADMIN_ONLY_MODULES.includes(mod.id));

  return (
    <aside className="print:hidden w-64 h-screen flex flex-col fixed left-0 top-0 z-30"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>

      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}>
            🌱
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Vivero ULEAM</h1>
            <p className="text-slate-400 text-xs">El Carmen · Gestión</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 hide-scrollbar">
        <div className="px-3 mb-2">
          <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
            Módulos
          </p>
        </div>

        <ul className="space-y-0.5 px-3">
          {visibleModules.map((mod) => {
            const isActive = currentModule === mod.id;
            const isDisabled = !mod.active;
            const SidebarSections = mod.SidebarSections;

            return (
              <li key={mod.id}>
                <button
                  id={`sidebar-nav-${mod.id}`}
                  onClick={() => mod.active && setCurrentModule(mod.id)}
                  disabled={isDisabled}
                  title={isDisabled ? 'Módulo en desarrollo — Próximamente' : mod.name}
                  className={`sidebar-item ${isActive ? 'sidebar-item-active' : isDisabled ? 'text-slate-600 cursor-not-allowed' : 'sidebar-item-inactive'}`}
                >
                  <NavIcon>{mod.icon}</NavIcon>
                  <span className="flex-1 text-left">{mod.name}</span>
                  {isDisabled && (
                    <span className="text-[9px] bg-slate-700/60 text-slate-500 px-1.5 py-0.5 rounded-full font-semibold tracking-wide">
                      Pronto
                    </span>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 flex-shrink-0 pulse-active" />
                  )}
                </button>
                {isActive && SidebarSections && <SidebarSections />}
              </li>
            );
          })}
        </ul>

        <div className="px-3 mt-6 mb-2">
          <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
            Sistema
          </p>
        </div>
        <ul className="space-y-0.5 px-3">
          <li>
            <button className="sidebar-item sidebar-item-inactive opacity-50 cursor-not-allowed" disabled>
              <NavIcon>🔔</NavIcon>
              <span>Alertas</span>
              <span className="ml-auto w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                3
              </span>
            </button>
          </li>
          <li>
            <button className="sidebar-item sidebar-item-inactive opacity-50 cursor-not-allowed" disabled>
              <NavIcon>👤</NavIcon>
              <span>Mi Perfil</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
            MG
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 text-xs font-medium truncate">Módulo Planificación</p>
            <p className="text-slate-500 text-[10px]">v1.0 · Prototipo</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
