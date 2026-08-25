import { useState } from 'react';
import { Construction } from 'lucide-react';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './modules/Dashboard/pages/DashboardPage';
import { PlanningModule } from './modules/Planning';
import { TrackingModule } from './modules/Tracking';
import { InventoryModule } from './modules/Inventory';
import { TasksModule } from './modules/Tasks';
import { LogisticsModule } from './modules/Logistics';
import { ConfiguracionPage } from './modules/Settings/pages/ConfiguracionPage';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { AuthGate } from './shared/components/AuthGate';
import { ActiveViveroProvider } from './shared/context/ActiveViveroContext';
import { ActiveViveroGate } from './shared/components/ActiveViveroGate';

function AppShell() {
  const { isAdmin } = useAuth();
  const [currentModule, setCurrentModule] = useState(isAdmin ? 'planning' : 'inventory');
  const [currentTab, setCurrentTab] = useState<string | undefined>();

  // Deep-link del escáner universal de la barra inferior móvil (ver
  // layouts/AdminLayout.tsx + shared/components/UniversalScannerModal.tsx):
  // según el formato del código decodificado, se abre el lote correspondiente
  // en Seguimiento o se pasa el código directo al flujo de Inventario.
  const [pendingLotScan, setPendingLotScan] = useState<{ id: number; nonce: number } | null>(null);
  const [pendingInventoryScan, setPendingInventoryScan] = useState<{ code: string; nonce: number } | null>(null);

  const handleUniversalScan = (decodedText: string) => {
    const match = decodedText.match(/^tracking-lot:(\d+)$/);
    if (match) {
      setPendingLotScan({ id: Number(match[1]), nonce: Date.now() });
      setCurrentModule('tracking');
    } else {
      setPendingInventoryScan({ code: decodedText, nonce: Date.now() });
      setCurrentModule('inventory');
    }
  };

  const renderCurrentModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return (
          <ToastProvider>
            <DashboardPage
              onNavigateToSettings={() => setCurrentModule('configuracion')}
              onNavigateToModule={setCurrentModule}
            />
          </ToastProvider>
        );
      case 'planning':
        return (
          <ToastProvider>
            <PlanningModule onTabChange={setCurrentTab} />
          </ToastProvider>
        );
      case 'configuracion':
        return (
          <ToastProvider>
            <ConfiguracionPage />
          </ToastProvider>
        );
      case 'tracking':
        return (
          <ToastProvider>
            <TrackingModule
              onTabChange={setCurrentTab}
              externalOpenLotId={pendingLotScan?.id}
              externalOpenLotNonce={pendingLotScan?.nonce}
            />
          </ToastProvider>
        );
      case 'inventory':
        return (
          <ToastProvider>
            <InventoryModule
              onTabChange={setCurrentTab}
              externalScanCode={pendingInventoryScan?.code}
              externalScanNonce={pendingInventoryScan?.nonce}
            />
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
              <Construction className="w-16 h-16 text-slate-300 mx-auto drop-shadow-md" />
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
      onUniversalScan={handleUniversalScan}
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
