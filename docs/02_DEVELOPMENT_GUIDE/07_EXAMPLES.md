# 02_DEVELOPMENT_GUIDE/07_EXAMPLES.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Ejemplos completos de referencia

Este documento no enseña conceptos nuevos — es un mapa hacia el código real que ya implementa cada patrón, para que copies la estructura correcta en vez de reinterpretarla.

---

## 1. Backend — flujo completo (Controller → Service → Repository → Model)

Caso real: "generar el cronograma de un ciclo productivo" (`POST /api/v1/production-cycles/{id}/generate-schedule`).

| Capa | Archivo |
|---|---|
| Ruta | `backend/app/Modules/Planning/Routes/api.php` |
| Request | `backend/app/Modules/Planning/Requests/GenerateScheduleRequest.php` |
| Controller | `backend/app/Modules/Planning/Controllers/ProductionCycleController.php` → método `generateSchedule()` |
| Service | `backend/app/Modules/Planning/Services/PlanningService.php` → método `generateSchedule()` |
| Models involucrados | `ProductionCycle`, `CycleLot`, `CycleLotPhase`, `ProductionPhase`, `Lot` (todos en `Planning/Models/`) |
| Respuesta | `BaseApiController::successResponse()` (heredado desde `Shared/Controllers/BaseApiController.php`) |

Léelo en ese orden para entender el flujo completo de una operación que sí tiene lógica de negocio real (cálculo de fechas por fase dentro de una transacción).

---

## 2. Backend — CRUD simple con Service + Repository

Caso real: metas de producción. Es el ejemplo a copiar para cualquier entidad CRUD nueva — nótese que ni siquiera el `create()` más simple salta directo al Model.

| Capa | Archivo |
|---|---|
| Request | `backend/app/Modules/Planning/Requests/{Create,Update}ProductionGoalRequest.php` |
| Controller | `backend/app/Modules/Planning/Controllers/ProductionGoalController.php` |
| Service | `backend/app/Modules/Planning/Services/ProductionGoalService.php` |
| Interfaz de Repository | `backend/app/Modules/Planning/Repositories/Contracts/ProductionGoalRepositoryInterface.php` |
| Implementación de Repository | `backend/app/Modules/Planning/Repositories/Eloquent/ProductionGoalRepository.php` |
| Binding | `backend/app/Providers/AppServiceProvider.php` → método `register()` |
| Base compartida | `backend/app/Modules/Shared/Repositories/Eloquent/BaseRepository.php`, `Shared/Services/BaseService.php` |
| Test end-to-end | `backend/tests/Feature/PlanningCrudTest.php` |

El mismo patrón se repite para `ProductionPlan`, `ProductionPhase` y `Lot` — este último (`LotService::create()`) es además el ejemplo de referencia para una regla de negocio real dentro de un CRUD (generar un código único cuando no se envía uno), delegando la consulta de unicidad al Repository (`LotRepository::generateUniqueCode()`).

Caso adicional con consulta reutilizable expuesta como método propio del Repository (no CRUD genérico): `backend/app/Modules/Planning/Repositories/Eloquent/ProductionCycleRepository.php::getCyclesWithDetails()`.

---

## 3. Backend — Modelo compartido entre módulos

Caso real: `User` vive en `Shared` y es referenciado por `Planning`.

```php
// backend/app/Modules/Planning/Models/ProductionGoal.php
use App\Modules\Shared\Models\User;

public function creator(): BelongsTo
{
    return $this->belongsTo(User::class, 'created_by');
}
```

Así se referencia un modelo de `Shared` desde cualquier módulo: import explícito por namespace completo, nunca copiando el modelo dentro de tu propio módulo.

---

## 4. Frontend — flujo completo (Page → ViewModel → Service)

Caso real: pantalla de Metas de Producción.

| Capa | Archivo |
|---|---|
| Types | `frontend/src/modules/Planning/types/index.ts` → `MetaProduccion` |
| Service | `frontend/src/modules/Planning/services/planningService.ts` → `getGoals`, `createGoal`, `updateGoal` |
| ViewModel | `frontend/src/modules/Planning/viewmodels/useMetasViewModel.ts` |
| Page | `frontend/src/modules/Planning/pages/MetasPage.tsx` |
| Componentes UI reutilizados | `frontend/src/components/ui/{Button,Badge,Skeleton,SlideOver}.tsx` |

---

## 5. Frontend — componente propio del módulo vs. componente compartido

- `frontend/src/modules/Planning/components/KpiCard.tsx` — específico del dashboard de Planning, vive dentro del módulo.
- `frontend/src/components/ui/Skeleton.tsx` — genérico, usado por cualquier módulo, vive en el nivel raíz de `components/`.

Regla para decidir dónde va un componente nuevo: si al escribirlo tuvieras que importar algo de `types/` de tu módulo (una entidad del dominio), va dentro del módulo. Si es puramente visual y no conoce el dominio, va en `components/ui/`.

---

## 6. Frontend — utils puros

`frontend/src/modules/Planning/utils/ganttHelpers.ts` contiene `parseDate`, `diffDays`, `getMonthLabels`: funciones sin estado, sin JSX, reutilizadas por `useCronogramaViewModel` y `CronogramaPage`. Este es el patrón a seguir para cualquier cálculo puro que se repita.

---

## 7. Módulo completo de referencia

Si necesitas ver "un módulo entero, bien armado, de punta a punta", no hay mejor ejemplo que recorrer:

```
backend/app/Modules/Planning/
frontend/src/modules/Planning/
```

Cualquier módulo nuevo (`Inventory`, `Logistics`, `Tasks`, `Tracking`) debe verse estructuralmente igual a este, solo que con las entidades de su propio dominio.

---

## AI Summary

Antes de escribir un patrón "desde cero", busca primero si `Planning` ya lo resuelve y cópialo. Este documento es el índice hacia esos ejemplos reales — no reinventes la forma de un Repository, un ViewModel o un Service: la forma correcta ya está en el repositorio.
