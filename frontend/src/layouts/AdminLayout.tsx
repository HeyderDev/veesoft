import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { modulesRegistry } from './modulesRegistry';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentModule: string;
  currentTab?: string;
  setCurrentModule: (module: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentModule,
  currentTab,
  setCurrentModule,
}) => {
  // El Sidebar y el contenido comparten el mismo NavProvider (si el módulo activo
  // declara uno) — así el panel de secciones del Sidebar y la página principal
  // quedan sincronizados en el mismo estado. Ver layouts/modulesRegistry.tsx.
  const NavProvider = modulesRegistry.find(m => m.id === currentModule)?.NavProvider ?? React.Fragment;

  return (
    <NavProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar currentModule={currentModule} setCurrentModule={setCurrentModule} />
        <div className="flex-1 ml-64 flex flex-col min-h-screen print:ml-0">
          <Header currentModule={currentModule} currentTab={currentTab} />
          <main className="flex-1 p-6 overflow-x-hidden print:p-0 print:overflow-visible print:bg-white">
            {children}
          </main>
        </div>
      </div>
    </NavProvider>
  );
};
