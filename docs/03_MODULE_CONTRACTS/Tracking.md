# 03_MODULE_CONTRACTS/Tracking.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Tracking

**Estado:** No implementado en su propio módulo — **`ClimateEvent`, `ClimateEventLot`, `Alert` y `ProductionHistory` viven provisionalmente dentro de `Planning`** mientras no había dueño para este módulo. Es lo primero que debe revisar el compañero responsable de `Tracking` junto con el Arquitecto.

---

## 1. Responsabilidad

Seguimiento del desarrollo de las plántulas: eventos climáticos que afectan lotes, alertas generadas automáticamente, e historial de producción.

## 2. Situación de partida (importante)

Estas cuatro tablas y sus modelos existen hoy en `backend/app/Modules/Planning/Models/`:
- `ClimateEvent` / `ClimateEventLot` — evento climático y su relación con lotes afectados.
- `Alert` — alertas generadas (relacionadas a `CycleLot`).
- `ProductionHistory` — historial, relacionado a `ProductionCycle`.

**Decisión pendiente de Fase 2** (no la tomes solo): mover estos cuatro modelos (+ sus migraciones y factories) de `Planning/Models` a `Tracking/Models`, y reemplazar el acceso directo (`CycleLot::alerts()`, `ProductionCycle::histories()`) por un `TrackingService` público que `Planning` consuma. Las migraciones ya existen — el movimiento cambia namespace, no crea tablas nuevas.

## 3. Servicios públicos que debería ofrecer una vez migrado

| Método propuesto | Para qué lo consumiría `Planning` (u otros) |
|---|---|
| `registerClimateEvent(array $data, array $affectedLotIds): ClimateEvent` | Registrar un evento climático y las alertas derivadas. |
| `getActiveAlerts(?int $cycleLotId = null): Collection` | Mostrar alertas activas, globales o por lote. |
| `getHistory(int $productionCycleId): Collection` | Historial de un ciclo para reportes. |

## 4. Dependencias permitidas

`Tracking` → `Planning` → `Shared`. `Tracking` consulta a `Planning` (por ejemplo, `getCurrentPhase()`, ver `docs/03_MODULE_CONTRACTS/Planning.md` §4) para saber en qué fase está un lote antes de generar una alerta relacionada a esa fase.

## 5. Antes de empezar

1. Coordina con el Arquitecto el movimiento de estas cuatro tablas fuera de `Planning`.
2. Sigue la estructura de `Planning` como plantilla para el resto del módulo.
3. Actualiza este documento y `docs/03_MODULE_CONTRACTS/Planning.md` §3 una vez migradas las tablas.
