# 03_MODULE_CONTRACTS/Tasks.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Tasks

**Estado:** No implementado en su propio módulo — **existe una tabla `OperationalTask` construida provisionalmente dentro de `Planning`** (`backend/app/Modules/Planning/Models/OperationalTask.php`) mientras no había dueño para este módulo. Es lo primero que debe revisar el compañero responsable de `Tasks` junto con el Arquitecto.

---

## 1. Responsabilidad

Administración de actividades operativas del vivero: tareas asignadas a personal, con estado, responsable y fecha, generalmente ligadas a una fase de un ciclo productivo.

## 2. Situación de partida (importante)

`OperationalTask` hoy vive en `Planning` con esta relación:
```php
// Planning/Models/CycleLotPhase.php
public function operationalTasks(): HasMany
{
    return $this->hasMany(OperationalTask::class);
}
```
```php
// Shared/Models/User.php
public function operationalTasks(): HasMany
{
    return $this->hasMany(OperationalTask::class, 'assigned_to');
}
```

**Decisión pendiente de Fase 2** (no la tomes solo): mover `OperationalTask` (modelo + migración + factory) de `Planning/Models` a `Tasks/Models`, y reemplazar el acceso directo por un `TaskService` público que `Planning` consuma para crear tareas ligadas a una fase. La migración de la tabla ya existe (`2026_01_01_001300_create_operational_tasks_table.php`) — al mover el módulo, se actualiza el namespace del modelo, no se crea una tabla nueva.

## 3. Servicios públicos que debería ofrecer una vez migrado

| Método propuesto | Para qué lo consumiría `Planning` |
|---|---|
| `createTaskForPhase(int $cycleLotPhaseId, array $data): OperationalTask` | Al generar un cronograma, crear las tareas operativas de cada fase. |
| `getTasksByAssignee(int $userId): Collection` | Vista de tareas por operario. |
| `completeTask(int $taskId): void` | Marcar tarea como realizada. |

## 4. Dependencias permitidas

`Tasks` → `Shared` (usuarios). `Tasks` puede depender de `Planning` (para conocer fases/ciclos), nunca al revés una vez completada la migración — mientras la tabla siga en `Planning`, es `Planning` quien expone el acceso vía su propio `PlanningService`.

## 5. Antes de empezar

1. Coordina con el Arquitecto el movimiento de `OperationalTask` fuera de `Planning`.
2. Sigue la estructura de `Planning` como plantilla para el resto del módulo.
3. Actualiza este documento y `docs/03_MODULE_CONTRACTS/Planning.md` §3 una vez migrada la tabla.
