# 02_DEVELOPMENT_GUIDE/01_MODULE_CREATION.md

> Versión: 1.1.0 · Última actualización: 2026-07-23 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Cómo crear un módulo nuevo

Este documento es la guía paso a paso para incorporar un módulo (Inventory, Logistics, Tasks, Tracking, Synchronization) al monolito. El módulo **Planning** ya existe completo en el repositorio (`backend/app/Modules/Planning` y `frontend/src/modules/Planning`) y debe usarse como referencia — cuando este documento diga "así", significa "cópialo de Planning".

---

## 1. Antes de escribir código

1. Confirma el nombre del módulo en inglés y en PascalCase (`Inventory`, no `inventario` ni `Inventarios`).
2. Revisa `docs/03_MODULE_CONTRACTS/<TuModulo>.md` — ya define qué servicios debe exponer tu módulo y de qué otros módulos puede depender. No inventes responsabilidades fuera de ese contrato.
3. Revisa `docs/01_ARCHITECTURE.md` sección 13 (Dependencias entre módulos) para saber a qué `Service` de otro módulo puedes llamar. Nunca a su `Repository`.
4. Si tu módulo necesita tablas nuevas, sigue el flujo de aprobación de `docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md` antes de crear la migración.

---

## 2. Estructura obligatoria — Backend

Las carpetas ya existen vacías en `backend/app/Modules/<TuModulo>/` (creadas por el Arquitecto en la Fase 1). No las renombres ni agregues carpetas nuevas.

```
backend/app/Modules/<TuModulo>/
├── Controllers/
├── Requests/
├── Services/
├── Repositories/
│   ├── Contracts/
│   └── Eloquent/
├── Models/
├── Policies/
├── Resources/
├── Routes/
│   └── api.php
├── Events/
├── Listeners/
├── DTO/
├── Enums/
└── Traits/
```

Namespace base: `App\Modules\<TuModulo>\...` (ver ejemplo real en `backend/app/Modules/Planning/Controllers/ProductionGoalController.php`).

### Pasos

1. **Models** — crea tus modelos Eloquent en `Models/`, namespace `App\Modules\<TuModulo>\Models`. Si necesitas relacionarte con `User` o `Role`, impórtalos desde `App\Modules\Shared\Models`.
2. **Repositories** — define la interfaz en `Repositories/Contracts/<Entidad>RepositoryInterface.php` extendiendo `App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface`, y su implementación en `Repositories/Eloquent/<Entidad>Repository.php` extendiendo `App\Modules\Shared\Repositories\Eloquent\BaseRepository`. Ejemplo real: `Planning/Repositories/Eloquent/ProductionCycleRepository.php`.
3. **Services** — toda la lógica de negocio va aquí, en `Services/<TuModulo>Service.php`. Si expones operaciones a otros módulos, esos métodos son tu API interna (ver `docs/03_MODULE_CONTRACTS/<TuModulo>.md`).
4. **Requests** — un `FormRequest` por cada operación de escritura (`Requests/CreateXRequest.php`, no valides a mano dentro del controller).
5. **Controllers** — extienden `App\Modules\Shared\Controllers\BaseApiController` para heredar `successResponse()`, `paginatedResponse()`, `errorResponse()`, `createdResponse()`, `noContentResponse()`.
6. **Routes** — declara tus rutas en `Routes/api.php` (mismo patrón que `Planning/Routes/api.php`). Luego agrega una línea en el `backend/routes/api.php` raíz:
   ```php
   Route::group([], base_path('app/Modules/<TuModulo>/Routes/api.php'));
   ```
   Ese archivo raíz ya trae la línea comentada para tu módulo — solo descoméntala.
7. Registra los bindings de tus repositorios en `App\Providers\AppServiceProvider::register()`, siguiendo el mismo patrón que los bindings de Planning.

### Prohibido

- Crear un segundo proyecto Laravel o un segundo `composer.json`.
- Poner Models/Services fuera de `app/Modules/<TuModulo>`.
- Que un Controller llame directamente a `Model::create()` sin pasar por un Service — ver `docs/02_DEVELOPMENT_GUIDE/02_BACKEND_GUIDE.md` para la excepción documentada de CRUD simple.
- Acceder a `App\Modules\OtroModulo\Repositories\*` desde tu módulo.

---

## 3. Estructura obligatoria — Frontend

```
frontend/src/modules/<TuModulo>/
├── components/     # componentes de presentación propios del módulo
├── pages/          # pantallas completas (una por ruta/tab)
├── viewmodels/      # hooks useXViewModel() con estado + efectos + handlers
├── services/       # única capa que llama a axiosClient
├── hooks/          # hooks reutilizables que no son viewmodels de pantalla
├── types/          # interfaces TypeScript del dominio del módulo
├── routes/         # definición de rutas del módulo
├── utils/          # funciones puras auxiliares
└── index.ts        # barrel: qué expone el módulo hacia el resto de la app
```

Ejemplo real completo: `frontend/src/modules/Planning/`.

### Pasos

1. **types/index.ts** — define las interfaces de tus entidades (ver `Planning/types/index.ts`).
2. **services/<tuModulo>Service.ts** — un objeto con un método por endpoint, usando `axiosClient` desde `../../../shared/services/axiosClient`. Ningún componente ni viewmodel debe importar `axiosClient` directamente (ver `Planning/services/planningService.ts`).
3. **viewmodels/use<Pantalla>ViewModel.ts** — un hook por pantalla. Contiene `useState`, `useEffect` y los handlers (`handleSave`, `openCreate`, etc.). Devuelve solo lo que la página necesita renderizar. No contiene JSX.
4. **pages/<Pantalla>Page.tsx** — JSX puro. Se limita a llamar al viewmodel y renderizar. No hace `fetch`/`axios` directamente.
5. **components/** — piezas de UI reutilizadas por más de una página del módulo (modales, tarjetas, nodos de árbol). Si un componente es reutilizable por *cualquier* módulo, va en `frontend/src/components/ui/`, no aquí.
6. **index.ts** — exporta el componente de entrada del módulo, sus rutas y su tipo público, tal como hace `Planning/index.ts`.
7. Registra tu módulo en `frontend/src/layouts/modulesRegistry.tsx` (cambia `active: false` a `active: true` en la entrada correspondiente — es el registro único que consume el Sidebar compartido) y móntalo en `App.tsx` siguiendo el mismo patrón que `PlanningModule`. Si tu módulo tiene navegación interna tipo drill-down (lista + secciones), ver `docs/02_DEVELOPMENT_GUIDE/03_FRONTEND_GUIDE.md` §10.

### Prohibido

- Instalar Redux o Zustand (el proyecto usa `useState`/Context; `@reduxjs/toolkit` está en `package.json` por una dependencia previa pero no debe usarse para módulos nuevos sin aprobación del Arquitecto).
- Crear un segundo proyecto React o un segundo `package.json`.
- Llamar a `axios` fuera de tu `services/`.
- Modificar componentes de otro módulo, o cualquier archivo de `frontend/src/layouts` más allá de tu propia entrada en `modulesRegistry.tsx`.

---

## 4. Integración final

1. Corre `php artisan route:list --path=api` y confirma que tus rutas aparecen con el controller correcto.
2. Corre `npx tsc --noEmit` en `frontend/` y confirma cero errores.
3. Corre `npm run build` en `frontend/` y confirma que compila.
4. Completa el checklist de `docs/02_DEVELOPMENT_GUIDE/06_CHECKLISTS.md` antes de abrir el Pull Request.

---

## AI Summary

Si vas a generar un módulo nuevo:

✔ Usa las carpetas ya creadas en `app/Modules/<Modulo>` y `src/modules/<Modulo>`, no crees otras.
✔ Backend: Controller → Service → Repository → Model, extendiendo las clases base de `Shared`.
✔ Frontend: Page (JSX) → ViewModel (hook) → Service (axios) → tipos en `types/`.
✔ Sigue exactamente el patrón de `Planning` — es la implementación de referencia.
✔ Registra rutas backend en tu `Routes/api.php` y descomenta la línea en `routes/api.php` raíz.
✔ Registra tu módulo en `layouts/modulesRegistry.tsx` (Sidebar compartido) y en `App.tsx`.

✘ No crees un segundo proyecto Laravel o React.
✘ No accedas al Repository de otro módulo.
✘ No pongas lógica de negocio en Controllers ni llamadas axios en componentes.
