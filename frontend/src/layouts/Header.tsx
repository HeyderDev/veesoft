import React from 'react';

interface HeaderProps {
  currentModule?: string;
  currentTab?: string;
}

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  planning: 'Planificación',
  tasks: 'Tareas',
  logistics: 'Logística',
  inventory: 'Inventario',
  tracking: 'Seguimiento',
  reportes: 'Reportes',
  configuracion: 'Configuración',
};

export const Header: React.FC<HeaderProps> = ({ currentModule = 'planning', currentTab }) => {
  const moduleName = breadcrumbMap[currentModule] ?? currentModule;
  const today = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-white/90 backdrop-blur-sm border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">

      {/* Left — Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-medium">Vivero ULEAM</span>
        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-700 font-semibold">{moduleName}</span>
        {currentTab && (
          <>
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-emerald-600 font-semibold">{currentTab}</span>
          </>
        )}
      </div>

      {/* Right — Actions & User */}
      <div className="flex items-center gap-3">
        {/* Date */}
        <span className="hidden md:block text-xs text-slate-400 capitalize">
          {today}
        </span>

        <div className="h-5 w-px bg-slate-200" />

        {/* Notifications */}
        <button
          id="header-notifications-btn"
          className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          title="Alertas del sistema"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-700 leading-tight">Admin ULEAM</p>
            <p className="text-xs text-slate-400">Coordinador de Vivero</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            AU
          </div>
        </div>
      </div>
    </header>
  );
};
