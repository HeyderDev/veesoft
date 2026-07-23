/**
 * Definición de rutas del módulo Planning.
 *
 * App.tsx todavía monta el módulo por selección de pestaña (ver PlanningTabs),
 * no por React Router. Esta lista es el contrato de navegación del módulo
 * para cuando se migre a enrutamiento real (ver router/AppRouter.tsx).
 */
export const planningRoutes = [
  { path: '/planning', label: 'Dashboard' },
  { path: '/planning/metas', label: 'Metas' },
  { path: '/planning/planes', label: 'Planes' },
  { path: '/planning/lotes', label: 'Lotes' },
  { path: '/planning/fases', label: 'Fases' },
  { path: '/planning/cronograma', label: 'Cronograma' },
  { path: '/planning/detalle', label: 'Árbol Relacional' },
];
