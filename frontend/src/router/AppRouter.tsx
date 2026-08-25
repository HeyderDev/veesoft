import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';

// NOTA: App.tsx todavía navega con estado local (currentModule), no con estas
// rutas. Esta es la base para migrar a enrutamiento real cuando se integren
// más módulos en la Fase 2 — ver docs/02_DEVELOPMENT_GUIDE/03_FRONTEND_GUIDE.md.
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Rutas Privadas con Layout */}
        <Route
          path="/"
          element={
            <AdminLayout currentModule="dashboard" setCurrentModule={() => {}} onUniversalScan={() => {}}>
              <div className="p-4"><h1 className="text-2xl font-bold">Dashboard</h1><p>Bienvenido al sistema ERP del Vivero de Cacao.</p></div>
            </AdminLayout>
          }
        >
          {/* Aquí irán las demás rutas de características cuando se migre a Outlet-based layout */}
        </Route>

        {/* Rutas Públicas (Login, etc) - por ahora un placeholder */}
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
