import React from 'react';
import { PlanningNavProvider, PlanningSidebarSections } from '../modules/Planning';
import { InventoryNavProvider, InventorySidebarSections } from '../modules/Inventory';

export interface ModuleDescriptor {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  /**
   * Opcional. Envuelve el Sidebar y el contenido principal con el mismo Provider,
   * para que un módulo con navegación interna tipo drill-down (ej. Planning: lista de
   * Viveros → secciones) comparta ese estado entre su panel del sidebar y su
   * contenido — ver frontend/src/modules/Planning/hooks/usePlanningNav.tsx como
   * referencia. Los módulos sin este tipo de navegación simplemente lo omiten.
   */
  NavProvider?: React.FC<{ children: React.ReactNode }>;
  /**
   * Opcional. Contenido desplegado bajo la entrada del módulo en el Sidebar mientras
   * ese módulo está activo (ej. la lista de Viveros + sus secciones). Ver
   * frontend/src/modules/Planning/components/PlanningSidebarSections.tsx.
   */
  SidebarSections?: React.FC;
}

/**
 * Registro único de módulos para el Sidebar compartido (Sidebar.tsx) y AdminLayout.
 * Cada módulo nuevo se registra agregando/activando su propia entrada aquí — ver
 * docs/09_MASTER_PROMPTS/01_ADAPT_INDIVIDUAL_MODULE.md paso de "Registro final".
 */
export const modulesRegistry: ModuleDescriptor[] = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊', active: true },
  {
    id: 'planning', name: 'Planificación', icon: '📅', active: true,
    NavProvider: PlanningNavProvider,
    SidebarSections: PlanningSidebarSections,
  },
  { id: 'tasks', name: 'Tareas', icon: '✅', active: true },
  { id: 'logistics', name: 'Logística', icon: '🚚', active: false },
  { 
    id: 'inventory', name: 'Inventario', icon: '📦', active: true,
    NavProvider: InventoryNavProvider,
    SidebarSections: InventorySidebarSections
  },
  { id: 'tracking', name: 'Seguimiento', icon: '🌱', active: false },
  { id: 'reportes', name: 'Reportes', icon: '📈', active: false },
  { id: 'configuracion', name: 'Configuración', icon: '⚙️', active: false },
];
