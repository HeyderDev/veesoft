import type { RouteObject } from 'react-router-dom';
import InventoryDashboardPage from '../pages/InventoryDashboardPage';
import ToolsPage from '../pages/ToolsPage';
import SuppliesPage from '../pages/SuppliesPage';
import MovementsPage from '../pages/MovementsPage';
import MaintenancePage from '../pages/MaintenancePage';
import ReportsPage from '../pages/ReportsPage';

import { ScannerPage } from '../pages/ScannerPage';
import StudentsPage from '../pages/StudentsPage';

export const inventoryRoutes: RouteObject[] = [
  {
    path: '',
    element: <InventoryDashboardPage />,
  },
  {
    path: 'scanner',
    element: <ScannerPage />,
  },
  {
    path: 'herramientas',
    element: <ToolsPage />,
  },
  {
    path: 'insumos',
    element: <SuppliesPage />,
  },
  {
    path: 'historial',
    element: <MovementsPage />,
  },
  {
    path: 'mantenimiento',
    element: <MaintenancePage />,
  },
  {
    path: 'reportes',
    element: <ReportsPage />,
  },
  {
    path: 'estudiantes',
    element: <StudentsPage />,
  },
];
