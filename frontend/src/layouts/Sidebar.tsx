import React from 'react';
import { Settings } from 'lucide-react';
import { modulesRegistry } from './modulesRegistry';
import { useAuth } from '../shared/context/AuthContext';

// Módulos a los que Operario no tiene acceso — el backend ya los bloquea (403),
// esto es solo para no mostrar una pestaña que va a fallar.
const ADMIN_ONLY_MODULES = ['planning', 'dashboard', 'logistics'];

interface SidebarProps {
  currentModule: string;
  setCurrentModule: (module: string) => void;
  /** Cuando se monta dentro de MobileDrawer.tsx: ocupa el panel deslizable en vez
   * del riel fijo de escritorio (que solo existe desde `lg` en adelante). */
  forceVisible?: boolean;
}

const NavIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-base leading-none">
    {children}
  </span>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentModule, setCurrentModule, forceVisible = false }) => {
  const { isAdmin } = useAuth();
  const visibleModules = isAdmin
    ? modulesRegistry
    : modulesRegistry.filter(mod => !ADMIN_ONLY_MODULES.includes(mod.id));

  return (
    <aside
      className={`print:hidden w-72 flex-col z-30 ${
        forceVisible ? 'flex h-full' : 'hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen'
      }`}
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>

      {/* Logo / Brand — misma altura que el Header (h-16) para que ambos queden alineados */}
      <div className="h-16 px-5 flex items-center border-b border-slate-700/50">
        <img src="/logoHorizontal.svg" alt="Veesoft" className="h-8 w-auto" />
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
                  <NavIcon><mod.icon className="w-[18px] h-[18px]" /></NavIcon>
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

        {isAdmin && (
          <>
            <div className="px-3 mt-6 mb-2">
              <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
                Sistema
              </p>
            </div>
            <ul className="space-y-0.5 px-3">
              <li>
                <button
                  id="sidebar-nav-configuracion"
                  onClick={() => setCurrentModule('configuracion')}
                  className={`sidebar-item ${currentModule === 'configuracion' ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                >
                  <NavIcon><Settings className="w-[18px] h-[18px]" /></NavIcon>
                  <span>Configuración</span>
                </button>
              </li>
            </ul>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50 text-center">
        <p className="text-slate-400 text-xs font-semibold tracking-wide">Veesoft 2.0</p>
      </div>
    </aside>
  );
};
