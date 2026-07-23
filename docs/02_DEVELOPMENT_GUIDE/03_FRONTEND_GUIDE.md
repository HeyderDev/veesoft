# 02_DEVELOPMENT_GUIDE/03_FRONTEND_GUIDE.md

> Versión: 1.1.0 · Última actualización: 2026-07-23 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Guía Oficial de Frontend (React + MVVM)

Todos los ejemplos están tomados del módulo `Planning` (`frontend/src/modules/Planning`), que es código real y funcional del repositorio.

---

## 1. Patrón MVVM en React

```
Page (View)  →  useXViewModel() (ViewModel)  →  xService (Model/API)
   JSX              useState + useEffect            axiosClient
```

- **View (`pages/`)**: solo JSX. Recibe todo lo que necesita del hook.
- **ViewModel (`viewmodels/`)**: un hook `useXViewModel()` por pantalla. Contiene estado, efectos y handlers.
- **Service (`services/`)**: la única capa que importa `axiosClient`.

Nunca combines las tres cosas en un mismo archivo. Si ves un `.tsx` con `useState` + `axios.get` + JSX todo junto, sepáralo antes de continuar.

---

## 2. Types

Cada módulo define sus propias interfaces en `types/index.ts`. No uses `any` para entidades del dominio.

```ts
// frontend/src/modules/Planning/types/index.ts
export interface Lote {
  id: number;
  code: string;
  name: string;
  total_capacity: number;
  current_status: EstadoLote;
  // ...
}
```

Si un tipo se comparte entre módulos (por ejemplo, un `User` básico), va en `frontend/src/shared/`, no se duplica.

---

## 3. Service

Un objeto plano con un método por endpoint. Usa `axiosClient` desde `shared/services/axiosClient`.

```ts
// frontend/src/modules/Planning/services/planningService.ts
export const planningService = {
  getGoals: () => axiosClient.get<MetaProduccion[]>('/production-goals'),
  createGoal: (data: Partial<MetaProduccion>) => axiosClient.post('/production-goals', data),
  // ...
};
```

**Regla:** ningún componente ni viewmodel debe escribir `axiosClient.get(...)` directamente — siempre pasa por el objeto `xService`. Esto es lo que permite, en el futuro, interceptar todas las escrituras de un módulo para encolarlas en `Synchronization` sin tocar cada pantalla.

---

## 4. ViewModel (hook)

Un hook por pantalla, nombrado `use<Pantalla>ViewModel`. Devuelve un objeto plano con todo lo que la página necesita: datos, estado de carga, y funciones.

```ts
// frontend/src/modules/Planning/viewmodels/useMetasViewModel.ts
export function useMetasViewModel() {
  const [metas, setMetas] = useState<MetaProduccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // ...

  const fetchMetas = async () => {
    setIsLoading(true);
    try {
      const response = await planningService.getGoals();
      setMetas(response.data || []);
    } catch (err) {
      error('Error al cargar las metas de producción');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMetas(); }, []);

  return { metas: filtered, isLoading, openCreate, openEdit, handleSave, /* ... */ };
}
```

**Checklist:**
- [ ] ¿El nombre empieza con `use` y termina en `ViewModel`?
- [ ] ¿Llama al `service`, nunca a `axiosClient` directamente?
- [ ] ¿No contiene JSX?
- [ ] ¿Maneja sus propios estados de loading/error y expone mensajes vía `useToast`?

---

## 5. Page

JSX puro. Se limita a desestructurar el hook y renderizar.

```tsx
// frontend/src/modules/Planning/pages/MetasPage.tsx
export const MetasPage: React.FC = () => {
  const { metas, isLoading, openCreate, openEdit, handleSave } = useMetasViewModel();

  return (
    <div className="space-y-6">
      <Button onClick={openCreate}>Nueva Meta</Button>
      {isLoading ? <Skeleton /> : metas.map(meta => /* ... */)}
    </div>
  );
};
```

**Prohibido en una Page:** `useState` para datos de servidor, `axiosClient`, lógica de negocio (cálculos de porcentaje, validaciones complejas). Un `useState` local puramente de UI (por ejemplo, un acordeón abierto/cerrado dentro de la propia vista) sí puede vivir en la Page si no se comparte con el ViewModel.

---

## 6. Components

Piezas de presentación reutilizadas por más de una Page del mismo módulo (`FaseModal`, `KpiCard`, `TreeNode`). Si un componente no depende del dominio del módulo y podría usarlo cualquier otro (botones, badges, skeletons), va en `frontend/src/components/ui/`, no dentro del módulo.

---

## 7. Utils

Funciones puras sin estado ni dependencias de React (`ganttHelpers.ts`: `parseDate`, `diffDays`, `getMonthLabels`). Si una función no usa hooks ni JSX, no es un hook ni un componente — va en `utils/`.

---

## 8. Routes e index.ts

`routes/index.tsx` define el contrato de navegación del módulo (qué rutas existen, aunque hoy `App.tsx` navegue por pestañas y no por URL — ver nota en `frontend/src/router/AppRouter.tsx`).

`index.ts` es el único punto de entrada público del módulo:
```ts
export { PlanningTabs as PlanningModule } from './components/PlanningTabs';
export { planningRoutes } from './routes';
export { planningService } from './services/planningService';
export type { Lote, MetaProduccion /* ... */ } from './types';
```
Otro módulo (o `App.tsx`) solo debe importar desde `modules/<Modulo>` (el barrel), nunca alcanzar archivos internos con rutas profundas como `modules/Planning/pages/MetasPage`.

---

## 9. Estilo y librerías

- TailwindCSS para todo el styling. No agregues CSS-in-JS ni styled-components.
- `recharts` para gráficos (ya en uso en `DashboardPage`).
- Estado de servidor con `useState`/`useEffect` + el service del módulo. No agregues React Query/SWR sin aprobación del Arquitecto (cambiaría el patrón en los 5+ módulos restantes).
- Español para todo texto visible al usuario; inglés para nombres de archivos, componentes, variables y funciones.

---

## 10. Sidebar compartido: navegación interna tipo drill-down (opcional)

El Sidebar (`frontend/src/layouts/Sidebar.tsx`) es un componente **compartido** por
todos los módulos — ninguno construye su propio sidebar. Cada módulo se registra con
una entrada en `frontend/src/layouts/modulesRegistry.tsx` (`{ id, name, icon, active }`).

Si tu módulo es una simple pantalla (o un set de pestañas planas), esa entrada es todo
lo que necesitas — el Sidebar ya la muestra como un ítem de navegación normal.

Si en cambio tu módulo tiene una navegación interna de **dos niveles** — "elige un
elemento de una lista, y dentro de él navega varias secciones" (el caso de Planning:
elige un Vivero, y dentro navega Resumen/Lotes/Fases) — el Sidebar puede desplegar esa
navegación bajo tu entrada, sincronizada con el contenido principal. Para eso, tu
módulo declara dos piezas opcionales en su entrada de `modulesRegistry.tsx`:

- **`NavProvider`**: un componente Provider que envuelve Sidebar + contenido con un
  Context propio de tu módulo (estado: qué elemento está "entrado", qué sección está
  activa). Referencia exacta: `modules/Planning/hooks/usePlanningNav.tsx`.
- **`SidebarSections`**: el componente que el Sidebar monta bajo tu entrada cuando tu
  módulo está activo — consume el mismo Context vía tu propio hook (`usePlanningNav()`
  en el caso de Planning) y renderiza la lista/secciones. Referencia exacta:
  `modules/Planning/components/PlanningSidebarSections.tsx`.

El contenido principal de tu módulo (la página que monta `App.tsx`) consume ese mismo
hook para saber qué renderizar — ver `modules/Planning/components/PlanningTabs.tsx`.
Como `AdminLayout.tsx` monta tu `NavProvider` envolviendo tanto el Sidebar como el
contenido (ver su código), ambos comparten la misma instancia de estado sin necesidad
de Redux/Zustand ni de prop-drilling entre ellos.

Este patrón es completamente opcional — ambos campos se omiten si tu módulo no lo
necesita, y el Sidebar sigue funcionando exactamente igual para todos los demás.

---

## AI Summary

Si vas a generar código de frontend:

✔ Separa siempre Page (JSX) / ViewModel (hook) / Service (axios) / types.
✔ Un hook `useXViewModel` por pantalla, nunca lógica de fetch dentro de la Page.
✔ Todas las llamadas HTTP pasan por `services/<modulo>Service.ts`.
✔ Reutiliza `components/ui/*` para elementos genéricos (Button, Badge, Skeleton, SlideOver, Toast).
✔ Exporta el módulo completo a través de `index.ts`.
✔ TailwindCSS únicamente; nombres de componentes en PascalCase, hooks en camelCase con prefijo `use`.
✔ Regístrate en el Sidebar compartido vía `layouts/modulesRegistry.tsx`; si tu módulo tiene
  navegación interna tipo drill-down, sigue el patrón `NavProvider`/`SidebarSections` de §10.

✘ No llames a `axiosClient` desde un componente o página.
✘ No instales Redux, Zustand, React Query o styled-components sin aprobación.
✘ No importes archivos internos de otro módulo — solo su `index.ts`.
✘ No mezcles texto de UI en inglés ni nombres de código en español.
✘ No construyas tu propio Sidebar/layout — el de `frontend/src/layouts/` es compartido.
