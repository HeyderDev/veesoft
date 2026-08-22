/**
 * Definición de rutas del módulo Logistics.
 *
 * App.tsx todavía monta el módulo por selección de pestaña (ver LogisticsTabs),
 * no por React Router. Esta lista es el contrato de navegación del módulo
 * para cuando se migre a enrutamiento real (ver router/AppRouter.tsx).
 */
export const logisticsRoutes = [
  { path: '/logistics', label: 'Proveedores' },
  { path: '/logistics/purchase-orders', label: 'Órdenes de Compra' },
  { path: '/logistics/purchase-requests', label: 'Solicitudes' },
];
