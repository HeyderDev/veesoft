# 05_CODING_STANDARDS.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Convenciones de Código

---

## 1. Idioma

- Código (carpetas, archivos, clases, métodos, variables, rutas internas, nombres de tabla/columna): **inglés**.
- Texto visible al usuario (labels, botones, mensajes, placeholders): **español**.

```php
class PlanningService { public function createProductionGoal() {} }   // ✔
class ServicioPlanificacion { public function crearMetaProduccion() {} } // ✘
```
```tsx
<Button>Nueva Meta</Button>   // ✔ label en español, componente en inglés
<Boton>New Goal</Boton>       // ✘
```

## 2. Nombres — Backend (PHP / Laravel)

| Elemento | Convención | Ejemplo real |
|---|---|---|
| Clase | `PascalCase` | `ProductionGoalController`, `PlanningService` |
| Método / función | `camelCase` | `generateSchedule()`, `assignLots()` |
| Variable | `camelCase` | `$cycleLots`, `$customDurations` |
| Constante / Enum case | `UPPER_SNAKE_CASE` | `STATUS_ACTIVE` |
| Tabla / columna | `snake_case` | `production_cycles`, `target_seedlings` |
| Namespace de módulo | `App\Modules\<Modulo>\...` | `App\Modules\Planning\Services\PlanningService` |

Nunca `planningservice`, `production_goal_controller` ni `productionGoalController` para nombres de clase.

## 3. Nombres — Frontend (TypeScript / React)

| Elemento | Convención | Ejemplo real |
|---|---|---|
| Componente | `PascalCase` | `MetasPage`, `KpiCard`, `PlanningTabs` |
| Hook | `camelCase` con prefijo `use` | `useMetasViewModel`, `useToast` |
| Variable / función | `camelCase` | `fetchMetas`, `isSlideOverOpen` |
| Tipo / interfaz | `PascalCase` | `MetaProduccion`, `EstadoLote` |
| Archivo de componente | igual al componente | `KpiCard.tsx` exporta `KpiCard` |
| Archivo de hook | igual al hook | `useMetasViewModel.ts` |

## 4. Orden de métodos

En Controllers y Services: `index/getAll` → `store/create` → `show/get` → `update` → `destroy/delete` → métodos de negocio específicos al final. Así se lee cualquier archivo del proyecto en el mismo orden.

## 5. Comentarios

Solo cuando el código no explica el *por qué* por sí mismo (una decisión no obvia, una restricción externa, un workaround). No comentar *qué* hace una línea si el nombre de la variable/función ya lo dice.

```php
// ✔ explica un por qué no obvio
// Restamos 1 día porque el primer día cuenta (si dura 1 día y empieza el 10, termina el 10)
$currentEndDate = $currentStartDate->copy()->addDays(max(0, $duration - 1));
```
```php
// ✘ redundante, no aporta nada que el código no diga
// Suma la duración a la fecha de inicio
$currentEndDate = $currentStartDate->copy()->addDays($duration);
```

## 6. Tipado

TypeScript: nunca `any` para entidades del dominio (`Lote`, `MetaProduccion`, etc.) — siempre una interfaz en `types/`. `any` solo es aceptable temporalmente en un `catch` o en una integración de librería sin tipos.

PHP: usa property/parameter/return types siempre que el método lo permita (`protected PlanningService $planningService`, `public function generateSchedule(ProductionCycle $cycle, array $customDurations = [])`).

## 7. Formato

- Backend: sigue el estilo que ya aplica `laravel/pint` (incluido en `composer.json`). Corre `./vendor/bin/pint` antes de commitear si tu editor no lo hace automáticamente.
- Frontend: sigue la configuración de `eslint.config.js` ya presente en `frontend/`. Corre `npm run lint` antes de un PR.
- Indentación de 4 espacios en PHP, 2 espacios en TS/TSX (igual que el código ya existente).

## 8. Espacios y líneas en blanco

Una línea en blanco entre bloques lógicos (imports / propiedades / métodos), sin líneas en blanco duplicadas. Los `use` de PHP y los `import` de TS se agrupan y ordenan alfabéticamente dentro de su grupo (externos primero, luego internos por profundidad de ruta relativa).

---

## AI Summary

✔ Inglés en código, español en UI.
✔ `PascalCase` para clases/componentes/tipos, `camelCase` para métodos/variables/hooks, `snake_case` para tablas/columnas.
✔ Tipado fuerte siempre — nada de `any` para el dominio.
✔ Comentarios solo para el "por qué", nunca para repetir el "qué".

✘ No mezcles idiomas dentro del mismo tipo de elemento (nombres de clase en español, o labels de UI en inglés).
✘ No dejes un PR sin pasar `pint`/`lint`.
