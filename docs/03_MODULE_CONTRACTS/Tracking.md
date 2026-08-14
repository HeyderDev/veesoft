# 03_MODULE_CONTRACTS/Tracking.md

> Versión: 3.0.0 · Última actualización: 2026-07-27 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Tracking

**Estado:** Implementado e integrado en `develop`. Dos partes conviven bajo el mismo módulo, con dueños/orígenes distintos:
- `DispatchReport` — reporte de despacho real al cerrar un ciclo de `Planning` (ya existía en el commit inicial del repositorio).
- `TrackingLot` / `TrackingMovement` / `TrackingClient` — seguimiento de salidas de plántulas por lote hacia clientes, con QR y reportes. Reemplaza el diseño anterior basado en `TrackingItem` (rediseño de reglas de negocio, sesión 2026-07-27).

**Ubicación:** `backend/app/Modules/Tracking`, `frontend/src/modules/Tracking`.

---

## 1. Responsabilidad

Seguimiento del resultado de la producción: cuánto se despachó realmente al cerrar un ciclo (`DispatchReport`), y registro de salidas de plántulas por lote hacia clientes específicos, con QR permanente por lote y reportes general/por lote.

## 2. Situación de partida (histórico, sin resolver todavía)

`ClimateEvent`, `ClimateEventLot`, `Alert` y `ProductionHistory` siguen viviendo en `backend/app/Modules/Planning/Models/` (ver `docs/03_MODULE_CONTRACTS/Planning.md` §3). Moverlas a `Tracking` sigue siendo una **decisión pendiente de coordinar con el Arquitecto**.

## 3. Rediseño de reglas de negocio (2026-07-27)

Se eliminó por completo `TrackingItem` (no llegó a subirse a `develop`, así que se reescribió sin dejar rastro): ya no se "registran productos" ni se "consulta inventario" dentro de Tracking. En su lugar:

- **Los lotes se crean y administran en `Planning`** (`Lot`). Tracking solo los **lee** — nunca los crea, edita ni elimina. Sigue el mismo patrón que ya usaba `DispatchReportRepository` (leer Models de Planning directamente desde el Repository de Tracking, sin pasar por el Repository de Planning).
- **Solo hay movimientos de SALIDA** (despacho de plántulas a un cliente) — no hay entradas, porque Tracking ya no lleva una existencia propia que reponer.
- **Cliente obligatorio en cada salida**: nuevo modelo `TrackingClient` (nombre solo letras, cédula ecuatoriana validada con dígito verificador, celular de 10 dígitos).
- **QR fijo por lote**: el valor codificado (`tracking-lot:<id>`) depende únicamente del `id` del lote (inmutable en Planning) — no se persiste nada nuevo, siempre es el mismo QR para ese lote. Con descarga en SVG y JPG.
- **Escaneo de QR por cámara**: a diferencia de la sesión anterior (que lo dejó fuera de alcance), ahora sí está implementado con `html5-qrcode` (ya estaba instalada por `Inventory`) — al escanear, navega directo al lote.
- **Cantidad de salida validada contra `total_capacity` del lote** (dato de Planning), mismo tipo de regla que ya usa `DispatchReport`.

## 4. Entidades que posee

- `Dispatch` (tabla `dispatches`, propiedad física de `Planning` — `Tracking` es el único módulo autorizado a crear registros en ella; `Planning` solo cierra el ciclo).
- `TrackingClient` (tabla `tracking_clients`) — nombre, cédula (única, validada), celular. `SoftDeletes`; el historial de movimientos sigue mostrando el nombre del cliente aunque se elimine (`withTrashed()`).
- `TrackingMovement` (tabla `tracking_movements`) — salida de un `lot_id` (FK a `lots`, propiedad de Planning) hacia un `tracking_client_id` (obligatorio), con `quantity`, `movement_date`, `notes`. Sin `type` (solo existe salida) y sin soft deletes (histórico, append-only).
- **No posee** tabla de lotes — `Lot` sigue siendo 100% de `Planning`.

## 5. Servicios públicos

### `DispatchReportService` (sin cambios)

| Método | Para qué |
|---|---|
| `totalDispatchedForGoal(int $goalId): int` | Total real despachado de una meta — única fuente que usa Resumen Operativo. |
| `pendingCyclesForVivero(int $viveroId): Collection` | Ciclos cerrados a la espera de reporte. |
| `createReport(int $lotCycleId, int $quantity, ?string $dispatchedAt): Dispatch` | Registra el despacho real y completa la meta si corresponde. |

### `TrackingLotService`

| Método | Para qué |
|---|---|
| `list()` | Todos los lotes (de Planning) con su vivero, para la vista de tarjetas. |
| `getDetail(int $lotId): array` | Lote + su historial de movimientos (paginado). |

### `TrackingMovementService`

| Método | Para qué |
|---|---|
| `list(?int $lotId, int $perPage = 15)` | Historial de salidas, opcionalmente filtrado por lote. |
| `register(array $data): TrackingMovement` | Registra una salida. Rechaza (`DomainException`, HTTP 409) si la cantidad supera `total_capacity` del lote. |

### `TrackingClientService`

| Método | Para qué |
|---|---|
| `list(?string $search, int $perPage = 15)` | Búsqueda por nombre o cédula. |
| `create` / `update` / `delete` (heredados de `BaseService`) | CRUD estándar. |

### `TrackingSummaryService`

| Método | Para qué |
|---|---|
| `getGeneralSummary(): array` | Total de lotes, total de plántulas despachadas (todas las salidas) y ranking de clientes con más plántulas recibidas. |
| `getLotSummary(int $lotId): array` | Lote + su historial completo de salidas con cliente — para el "reporte por lote". |

## 6. Dependencias permitidas

`Tracking` → `Planning` → `Shared`. `Tracking` lee `Lot` de Planning directamente vía `TrackingLotRepository` (mismo patrón ya establecido por `DispatchReportRepository` con `LotCycle`/`Dispatch`) — no depende de ningún Service de Planning para esto, solo de sus Models.

## 7. Frontend

- `ReportesPage` (`DispatchReport`) sigue embebida como tab dentro de `Planning` (`PlanningTabs.tsx` la importa directamente) — no se tocó.
- Entrada propia de `Tracking` en el Sidebar (`modulesRegistry.tsx`, `id: 'tracking'`, `active: true`), con `TrackingTabs.tsx`: "Lotes" (tarjetas, con drill-down propio a un lote → salida + historial), "Reportes" (general/por lote), "Clientes" (CRUD), más un botón general de "Escanear QR".
- QR: generación con `qrcode.react` (`QRCodeSVG`/`QRCodeCanvas`), descarga en SVG (serializando el nodo `<svg>`) y JPG (`canvas.toDataURL`).
- Escaneo de QR: `html5-qrcode` (componente propio `CameraQrModal.tsx`, mismo patrón que `Inventory/components/WebScanner.tsx` pero sin importarlo — cada módulo tiene el suyo).
- Exportar PDF: `jspdf`.

## 8. Eventos de sincronización

- `TrackingClientCreated`, `TrackingClientUpdated`, `TrackingClientDeleted` → `tracking.client`.
- `TrackingMovementRegistered` → `tracking.movement`.
- `DispatchReported` → `tracking.dispatch`.

Los adaptadores viven en `Tracking/Services` y aplican datos únicamente mediante los Repositories del módulo dueño. Los movimientos y despachos son append-only; el cliente admite creación, actualización y soft delete.

## 9. Pendiente / a decidir

- Mover `ClimateEvent`/`ClimateEventLot`/`Alert`/`ProductionHistory` desde `Planning` a `Tracking` (ver §2) — sigue sin resolverse.
- El frontend trae dos librerías de QR distintas (`qrcode` de Inventory y `qrcode.react` de Tracking) — a decidir por el Arquitecto si vale la pena consolidar en una sola.
- No se implementó restricción para eliminar un `TrackingClient` con movimientos asociados más allá del `SoftDeletes` (el registro físico permanece, solo se oculta) — si se requiere bloquear la eliminación explícitamente, es una regla a agregar.
