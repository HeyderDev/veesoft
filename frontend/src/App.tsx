import { useState } from 'react';
import { AdminLayout } from './layouts/AdminLayout';
import { PlanningModule } from './modules/Planning';
import { TrackingModule } from './modules/Tracking';
import { InventoryModule } from './modules/Inventory';
import { TasksModule } from './modules/Tasks';
import { LogisticsModule } from './modules/Logistics';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { LoginPage } from './shared/pages/LoginPage';

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentModule, setCurrentModule] = useState('planning');
  const [currentTab, setCurrentTab] = useState<string | undefined>();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="mt-4 text-sm text-slate-500">Verificando sesión…</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
        ['planning', 'tracking', 'inventory', 'logistics'].includes(currentModule)
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
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
