import React from 'react';
import { BarChart3, Calendar, CheckCircle2, Package, Sprout, Truck, type LucideIcon } from 'lucide-react';
import { PlanningNavProvider, PlanningSidebarSections } from '../modules/Planning';
import { InventoryNavProvider, InventorySidebarSections } from '../modules/Inventory';
import { TasksSidebarSections, TasksNavProvider } from '../modules/Tasks';
import { LogisticsNavProvider, LogisticsSidebarSections } from '../modules/Logistics';
import { TrackingNavProvider, TrackingSidebarSections } from '../modules/Tracking';

export interface ModuleDescriptor {
  id: string;
  name: string;
  icon: LucideIcon;
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
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3, active: true },
  {
    id: 'planning', name: 'Planificación', icon: Calendar, active: true,
    NavProvider: PlanningNavProvider,
    SidebarSections: PlanningSidebarSections,
  },
  {
    id: 'tasks', name: 'Tareas', icon: CheckCircle2, active: true,
    NavProvider: TasksNavProvider,
    SidebarSections: TasksSidebarSections
  },
  {
    id: 'logistics', name: 'Logística', icon: Truck, active: true,
    NavProvider: LogisticsNavProvider,
    SidebarSections: LogisticsSidebarSections,
  },
  {
    id: 'inventory', name: 'Inventario', icon: Package, active: true,
    NavProvider: InventoryNavProvider,
    SidebarSections: InventorySidebarSections
  },
  {
    id: 'tracking', name: 'Seguimiento', icon: Sprout, active: true,
    NavProvider: TrackingNavProvider,
    SidebarSections: TrackingSidebarSections,
  },
  // 'configuracion' ya no es un placeholder acá — vive como entrada real en la
  // sección "Sistema" del sidebar (ver Sidebar.tsx), separada de los módulos.
];
