# 03_MODULE_CONTRACTS/Planning.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Planning

**Estado:** Implementado. Es el módulo de referencia del proyecto.
**Ubicación:** `backend/app/Modules/Planning`, `frontend/src/modules/Planning`.
**Responsable:** Arquitecto del proyecto (autor de este documento).

---

## 1. Responsabilidad

Transformar una meta de producción en un cronograma ejecutable: metas → planes → ciclos → asignación de lotes → generación automática de fases con fechas.

## 2. Entidades que posee

`ProductionGoal`, `ProductionPlan`, `ProductionCycle`, `ProductionPhase`, `Lot`, `CycleLot`, `CycleLotPhase`, `Reschedule`, `Dispatch`.

## 3. Entidades que posee temporalmente (a revisar en integración)

Estas tablas se crearon dentro de `Planning` porque, durante el desarrollo en solitario del módulo, no existía todavía el módulo dueño natural. **Deben re-evaluarse cuando se integre el módulo correspondiente**, no se mueven unilateralmente:

- `ClimateEvent`, `ClimateEventLot`, `Alert`, `ProductionHistory` — candidatas a vivir en **Tracking** (seguimiento del desarrollo de plántulas), ya que son eventos observados durante el crecimiento, no planificación en sí.
- `OperationalTask` — candidata a vivir en **Tasks** (administración de tareas operativas).
- `NurseryLayout`, `LotPosition`, `DashboardMetric` — de apoyo visual/reporting; se mantienen en Planning salvo que el dueño de un futuro módulo de Reportes las reclame.

Mientras no se decida la migración, **cualquier módulo que necesite estos datos los consume a través de `PlanningService`**, nunca leyendo la tabla directamente.

## 4. Servicios públicos (`PlanningService`)

| Método | Recibe | Devuelve | Uso |
|---|---|---|---|
| `assignLots(ProductionCycle $cycle, array $lotsData)` | Ciclo + `[{lot_id, assigned_seedlings}]` | Colección de `CycleLot` creados | Asigna lotes físicos a un ciclo dentro de una transacción. |
| `generateSchedule(ProductionCycle $cycle, array $customDurations = [])` | Ciclo + duraciones opcionales por fase (`{phase_code: dias}`) | Colección de `CycleLotPhase` generados | Calcula fechas de cada fase para cada lote del ciclo. |

Métodos adicionales que otros módulos necesitarán y **deben agregarse a este Service** (no reimplementarse en otro módulo) cuando se integren:

- `getAvailableLots(): Collection<Lot>` — para que `Inventory`/`Logistics` sepan cuánta capacidad libre hay.
- `getCurrentPhase(CycleLot $cycleLot): ?CycleLotPhase` — para que `Tracking` sepa en qué fase está un lote.

## 5. Endpoints REST expuestos

Definidos en `backend/app/Modules/Planning/Routes/api.php`: `production-goals`, `production-plans`, `production-cycles` (+ `assign-lots`, `generate-schedule`), `lots`, `production-phases`. Todos bajo el prefijo `/api/v1`.

## 6. Dependencias permitidas

`Planning` puede llamar a `Shared` (usuarios/roles). **No** puede llamar a `Inventory`, `Logistics`, `Tasks` ni `Tracking` — si en el futuro necesita datos de ellos, la dependencia se invierte (ellos consultan a `Planning`, ver sección 13 de `01_ARCHITECTURE.md`).

## 7. Frontend expuesto

`frontend/src/modules/Planning/index.ts` exporta `PlanningModule` (componente de entrada, actualmente un tab-switcher — ver `docs/02_DEVELOPMENT_GUIDE/03_FRONTEND_GUIDE.md`), `planningRoutes`, `planningService` y los tipos `MetaProduccion`, `PlanProduccion`, `Lote`, `Fase`, `Ciclo`. Otro módulo del frontend que necesite mostrar, por ejemplo, el nombre de un lote, importa `planningService` desde este barrel — nunca un archivo interno de `pages/` o `viewmodels/`.

## 8. Eventos que debe emitir (pendiente de implementar)

`LotCreated`, `CycleLotPhaseCompleted`, `ScheduleGenerated` — para que `Synchronization` los escuche y encole. Ver `docs/03_MODULE_CONTRACTS/Synchronization.md`. Hoy `PlanningService` no dispara eventos todavía; es la primera tarea pendiente antes de integrar `Synchronization`.
