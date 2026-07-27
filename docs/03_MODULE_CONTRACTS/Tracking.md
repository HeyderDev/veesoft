# 03_MODULE_CONTRACTS/Tracking.md

> Versión: 2.1.0 · Última actualización: 2026-07-27 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Tracking

**Estado:** Implementado e integrado en `develop` (junto a `Planning`, `Inventory`, `Tasks`, `Logistics`). Dos partes conviven bajo el mismo módulo, con dueños/orígenes distintos:
- `DispatchReport` — reporte de despacho real al cerrar un ciclo de `Planning` (ya existía en el commit inicial del repositorio).
- `TrackingItem` / `TrackingMovement` — seguimiento de existencias de plántulas por lote (entradas/salidas, alertas de stock bajo), adaptado desde el proyecto individual `app_vivero` en la sesión del 2026-07-26.

**Ubicación:** `backend/app/Modules/Tracking`, `frontend/src/modules/Tracking`.

---

## 1. Responsabilidad

Seguimiento del resultado de la producción: cuánto se despachó realmente al cerrar un ciclo (`DispatchReport`), y seguimiento de existencias de plántulas por lote con sus movimientos de entrada/salida y alertas de stock bajo (`TrackingItem`/`TrackingMovement`).

## 2. Situación de partida (histórico, sin resolver todavía)

`ClimateEvent`, `ClimateEventLot`, `Alert` y `ProductionHistory` siguen viviendo en `backend/app/Modules/Planning/Models/` (ver `docs/03_MODULE_CONTRACTS/Planning.md` §3). Moverlas a `Tracking` sigue siendo una **decisión pendiente de coordinar con el Arquitecto**, no tomada en esta sesión — esta sesión no las tocó.

## 3. Entidades que posee

- `Dispatch` (tabla `dispatches`, propiedad física de `Planning` — `Tracking` es el único módulo autorizado a crear registros en ella; `Planning` solo cierra el ciclo).
- `TrackingItem` (tabla `tracking_items`) — lote de plántulas en seguimiento: nombre, especie, etapa de crecimiento, cantidad, unidad, ubicación, stock mínimo.
- `TrackingMovement` (tabla `tracking_movements`) — entrada/salida de un `TrackingItem`, ajusta su cantidad de forma atómica.

## 4. Servicios públicos

### `DispatchReportService` (sin cambios en esta sesión)

| Método | Para qué |
|---|---|
| `totalDispatchedForGoal(int $goalId): int` | Total real despachado de una meta — única fuente que usa Resumen Operativo. |
| `pendingCyclesForVivero(int $viveroId): Collection` | Ciclos cerrados a la espera de reporte. |
| `createReport(int $lotCycleId, int $quantity, ?string $dispatchedAt): Dispatch` | Registra el despacho real y completa la meta si corresponde. |

### `TrackingItemService`

| Método | Para qué |
|---|---|
| `list(?string $search, ?string $stage, int $perPage = 15)` | Listado paginado con búsqueda y filtro por etapa. |
| `getDetail(int $id)` | Ítem con su historial de movimientos. |
| `create(array $data)` | Registra un ítem nuevo (la cantidad inicial se define aquí). |
| `update(int $id, array $data)` | Actualiza datos del ítem — **la cantidad no se edita aquí**, solo vía movimientos. |
| `delete(int $id)` | Elimina (soft delete) el ítem. |

### `TrackingMovementService`

| Método | Para qué |
|---|---|
| `list(?int $trackingItemId, int $perPage = 15)` | Historial de movimientos, opcionalmente filtrado por ítem. |
| `register(array $data): TrackingMovement` | Registra entrada/salida y ajusta la existencia del ítem en una transacción. Una salida nunca puede dejar la existencia en negativo (regla agregada respecto al proyecto original `app_vivero`, que no la validaba). |

### `TrackingSummaryService`

| Método | Para qué |
|---|---|
| `getSummary(): array` | Totales de ítems/cantidad y distribución por etapa de crecimiento. |
| `getStockAlerts(): Collection` | Ítems cuya cantidad ya llegó o bajó del stock mínimo. |

## 5. Dependencias permitidas

`Tracking` → `Planning` → `Shared` (para `DispatchReport`, que lee `Lot`/`LotCycle`/`ProductionGoal` de Planning). `TrackingItem`/`TrackingMovement` no dependen hoy de ningún otro módulo — son autocontenidos.

## 6. Frontend

- `ReportesPage` (`DispatchReport`) se consume embebida como tab dentro de `Planning` (`PlanningTabs.tsx` la importa directamente) — no se tocó.
- `SeguimientoPage`, `MovimientosPage`, `ResumenSeguimientoPage` son la entrada propia de `Tracking` en el Sidebar compartido (`modulesRegistry.tsx`, `id: 'tracking'`, ahora `active: true`), navegadas con tabs planas propias (`TrackingTabs.tsx`) — sin drill-down por vivero, ya que `TrackingItem` no está atado a un `Vivero` específico.
- QR: se genera (no se escanea) con `qrcode.react`, agregada en esta sesión.
- Exportar PDF: con `jspdf`, agregada en esta sesión.

## 7. Pendiente / a decidir en integración

- Mover `ClimateEvent`/`ClimateEventLot`/`Alert`/`ProductionHistory` desde `Planning` a `Tracking` (ver §2) — sigue sin resolverse, aplazado también en esta sesión de integración a pedido del equipo.
- Si `TrackingItem` debe asociarse a un `Vivero` o `Lot` de Planning (hoy `location` es texto libre, como en `app_vivero`) — no se decidió en esta sesión, se mantuvo el diseño original desacoplado.
- Escaneo de QR por cámara (no solo generación) quedó fuera de alcance — no aplica bien a un dashboard de escritorio.

## 8. Integración con `develop` (2026-07-27)

Reconciliación de esquema (Paso 2 del prompt de integración): `tracking_items`/`tracking_movements` no se solapan con ninguna tabla de `Inventory` (`tools`, `supplies`, `movements` — dominio de herramientas/insumos, no de plántulas) ni de ningún otro módulo ya integrado (`Tasks`, `Logistics`). `Tasks` ya había movido `OperationalTask` fuera de `Planning` antes de esta integración, como estaba previsto.

Nota menor (no bloqueante): el frontend ya trae dos librerías de QR distintas (`qrcode` de Inventory y `qrcode.react` de esta sesión) — quedan ambas, no se unificaron, a decidir por el Arquitecto si vale la pena consolidar en una sola.

`./vendor/bin/pint --test app/Modules` reporta 2 archivos con estilo pendiente (`Shared/Routes/api.php`, `Tasks/Services/OperationalTaskService.php`) — **preexistentes en `develop` antes de esta fusión**, no introducidos por `Tracking`. No se corrigieron en esta sesión por no ser dueño de esos módulos.

Verificación completa del sistema fusionado: `migrate:fresh --seed`, 51 tests (`php artisan test`), `route:list` (83 rutas, sin colisiones), `tsc --noEmit`, `npm run build` — todo en verde.
