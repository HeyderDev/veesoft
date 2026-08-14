# 03_MODULE_CONTRACTS/Tasks.md

> Versión: 1.2.0 · Última actualización: 2026-07-25 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Tasks

**Estado:** Implementado e integrado. La entidad `OperationalTask` ya fue extraída de `Planning`, reestructurada bajo la carpeta `Tasks` y reconciliada. Las dependencias externas han sido actualizadas.

---

## 1. Responsabilidad

Administración de actividades operativas del vivero: tareas asignadas a personal, con estado, responsable y fecha, que pueden estar ligadas a una fase de un ciclo productivo o ser de carácter general.

## 2. Entidades Relevantes

El módulo es dueño absoluto del modelo `OperationalTask`. Las relaciones hacia él desde otros módulos (como desde `User` o `LotCyclePhase`) no utilizan relaciones de Eloquent directas para preservar los límites del módulo. El acceso a los datos de las tareas operativas debe solicitarse exclusivamente a través del servicio expuesto `OperationalTaskService`.

## 3. Servicios públicos ofrecidos

El servicio principal es `OperationalTaskService` y expone los siguientes métodos reales que otros módulos (como `Planning` o `Shared`) pueden consumir:

| Método | Propósito |
|---|---|
| `createTask(array $data): OperationalTask` | Crear una tarea genérica. |
| `createTaskForPhase(int $cycleLotPhaseId, array $data): OperationalTask` | Al generar un cronograma, crear las tareas operativas ligadas a cada fase. |
| `updateTask(int $id, array $data): OperationalTask` | Actualizar una tarea existente. |
| `getTasksByAssignee(int $userId): Collection` | Recuperar todas las tareas asignadas a un usuario específico. |
| `getTasksByPhase(int $cycleLotPhaseId): Collection` | Recuperar todas las tareas ligadas a una fase específica de un ciclo de producción. |
| `completeTask(int $taskId): void` | Marcar una tarea como realizada y guardar su `completed_date`. |

## 4. Dependencias permitidas

- `Tasks` → `Shared` (User): Puede hacer referencia y relacionarse a `User` (assigned_to).
- `Tasks` → `Planning` (LotCyclePhase): Puede hacer referencia a la fase de un ciclo para registrar tareas específicas del ciclo de producción.

Ningún otro módulo puede depender directamente de la base de datos o Repositorios de `Tasks`.

## 5. Eventos de sincronización

- `OperationalTaskCreated`
- `OperationalTaskUpdated`
- `OperationalTaskCompleted`
- `OperationalTaskDeleted`

Todos usan la entidad `tasks.operational-task`. `OperationalTaskSyncAdapter` trata la tarea y sus filas de `operational_task_resources` como un solo agregado. Los eventos se emiten después de que la escritura y la actualización de recursos terminan correctamente.
