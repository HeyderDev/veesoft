import { useState } from 'react';
import { AdminLayout } from './layouts/AdminLayout';
import { PlanningModule } from './modules/Planning';
import { TrackingModule } from './modules/Tracking';
import { InventoryModule } from './modules/Inventory';
import { TasksModule } from './modules/Tasks';
import { LogisticsModule } from './modules/Logistics';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { AuthGate } from './shared/components/AuthGate';
import { ActiveViveroProvider } from './shared/context/ActiveViveroContext';
import { ActiveViveroGate } from './shared/components/ActiveViveroGate';

function AppShell() {
  const { isAdmin } = useAuth();
  const [currentModule, setCurrentModule] = useState(isAdmin ? 'planning' : 'inventory');
  const [currentTab, setCurrentTab] = useState<string | undefined>();

  const renderCurrentModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return (
          <div className="flex items-center justify-center h-[60vh] animate-fade-in">
            <div className="text-center space-y-4">
              <span className="text-6xl drop-shadow-md">📊</span>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard General</h2>
              <p className="text-slate-500 max-w-sm mx-auto">Vista global en construcción. Próximamente integración con todos los módulos.</p>
            </div>
          </div>
        );
      case 'planning':
        return (
          <ToastProvider>
            <PlanningModule onTabChange={setCurrentTab} />
          </ToastProvider>
        );
      case 'tracking':
        return (
          <ToastProvider>
            <TrackingModule onTabChange={setCurrentTab} />
          </ToastProvider>
        );
      case 'inventory':
        return (
          <ToastProvider>
            <InventoryModule onTabChange={setCurrentTab} />
          </ToastProvider>
        );
      case 'tasks':
        return (
          <ToastProvider>
            <TasksModule onTabChange={setCurrentTab} />
          </ToastProvider>
        );
      case 'logistics':
        return (
          <ToastProvider>
            <LogisticsModule onTabChange={setCurrentTab} />
          </ToastProvider>
        );
      default:
        return (
          <div className="flex items-center justify-center h-[60vh] animate-fade-in">
            <div className="text-center space-y-4">
              <span className="text-6xl drop-shadow-md">🚧</span>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Módulo en Desarrollo</h2>
              <p className="text-slate-500">Este módulo estará disponible en la próxima versión.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <AdminLayout
      currentModule={currentModule}
      currentTab={
        ['planning', 'tracking', 'inventory', 'logistics', 'tasks'].includes(currentModule)
          ? currentTab
          : undefined
      }
      setCurrentModule={setCurrentModule}
    >
      {renderCurrentModule()}
    </AdminLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <ActiveViveroProvider>
          <ActiveViveroGate>
            <AppShell />
          </ActiveViveroGate>
        </ActiveViveroProvider>
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
