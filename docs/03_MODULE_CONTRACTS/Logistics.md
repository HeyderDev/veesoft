# 03_MODULE_CONTRACTS/Logistics.md

> Versión: 2.0.0 · Última actualización: 2026-07-25 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Logistics

**Estado:** Implementado.
**Ubicación:** `backend/app/Modules/Logistics`, `frontend/src/modules/Logistics`.
**Responsable:** Juan (adaptado desde el proyecto individual `sistema/`, Node/Express + PostgreSQL).

---

## 1. Responsabilidad

Gestión de compras y proveedores: solicitudes de aprovisionamiento, órdenes de compra, proveedores.

## 2. Entidades que posee

`Supplier`, `SupplierEvaluation`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseReceipt`, `PurchaseRequest`, `PurchaseRequestItem`.

`PurchaseRequest`/`PurchaseRequestItem` no existían en el sistema individual anterior (`sistema/`) — ahí las órdenes se creaban directamente. Se agregaron para cumplir el contrato original (`createPurchaseRequest`, disparado cuando `Inventory` detecte stock bajo) y para soportar también un flujo manual: un usuario solicita insumos, un responsable la revisa y, si aprueba, se genera la `PurchaseOrder` real.

## 3. Reglas de negocio implementadas

Portadas desde `sistema/` y verificadas contra su lógica original (triggers de PostgreSQL, controllers, tests):

- **Proveedor**: RUC/Cédula validado con el algoritmo oficial de Ecuador (módulo 10/11 del SRI/Registro Civil), único (`ValidatesEcuadorianTaxId`). El `score` (0.00–5.00) nunca lo asigna el usuario: es el promedio ponderado de sus evaluaciones — calidad 40% + puntualidad 30% + precio 20% + servicio postventa 10% (`cumplimiento` se guarda pero no participa, igual que en el sistema anterior). En `sistema/` este cálculo lo hacía un trigger de PostgreSQL; aquí lo recalcula `SupplierService::recalculateScore()` dentro de una transacción cada vez que se registra una evaluación nueva, porque MySQL/Eloquent no tiene ese trigger.
- **Orden de compra**: solo se puede emitir a un proveedor `active` con score ≥ 3.00 (`SupplierService::MINIMUM_SCORE_FOR_ORDERS`). Sin fecha de entrega, se asume hoy + 5 días. El total es la suma de cantidad × precio unitario de cada ítem.
- **Recepción**: una orden solo se puede recibir una vez. Con calidad `approved`/`conditional` la orden pasa a `received` y se dispara `PurchaseOrderReceived` (para que `Inventory` actualice stock cuando ese módulo exista); con `rejected` pasa a `cancelled`. La temperatura del sustrato fuera de 18–24°C es solo una advertencia informativa, no bloquea la recepción (igual que en `sistema/`).
- **Pendientes por llegar**: cada ítem de una orden `issued`/`sent` se clasifica por urgencia según su fecha de entrega estimada: `red` si ya venció, `yellow` si es mañana, `green` en otro caso.
- **Solicitud de aprovisionamiento**: solo se puede revisar una vez (`pending` → `approved`/`rejected`). Aprobar exige elegir proveedor y genera una `PurchaseOrder` real reutilizando las reglas de arriba (proveedor activo, score ≥ 3.00).

## 4. Servicios públicos

### `SupplierService`

| Método | Recibe | Devuelve | Uso |
|---|---|---|---|
| `list(int $perPage = 15)` | — | Página de `Supplier`, ordenada por score descendente | Listado del directorio de proveedores. |
| `getDetail(int $id)` | ID | `Supplier` con relaciones | Detalle de un proveedor. |
| `create(array $data)` | Datos del proveedor | `Supplier` creado | Alta de proveedor (valida RUC/CI, score inicial 0). |
| `update(int $id, array $data)` | ID + datos | `Supplier` actualizado | Edición (re-valida RUC/CI solo si cambió). |
| `evaluate(int $supplierId, array $data)` | ID + criterios de evaluación | `Supplier` con score recalculado | Registra evaluación y recalcula el score ponderado. |
| `getSupplierByItem(string $itemSku): ?Supplier` | SKU de un ítem | Proveedor mejor calificado que históricamente lo ha suministrado, o `null` | **Pensado para que `Inventory` lo consuma** al decidir a quién comprar. |

### `PurchaseOrderService`

| Método | Recibe | Devuelve | Uso |
|---|---|---|---|
| `list(int $perPage = 15)` / `getDetail(int $id)` / `listForSupplier(int $supplierId, int $perPage = 15)` | — | Órdenes con relaciones | Listados. |
| `create(array $data)` | `order_number`, `supplier_id`, `estimated_delivery_date?`, `items[]` | `PurchaseOrder` creada | Genera una orden (valida proveedor activo + score ≥ 3.00). |
| `receive(int $orderId, array $data)` | `quality_status`, `substrate_temperature?`, `observations?`, `photo_evidence_url?` | `{receipt, order, temperature_warning}` | Registra la recepción (HU-06). |
| `pendingDeliveries(): array` | — | Ítems pendientes clasificados por urgencia | Alimenta el panel "Insumos por Llegar". |

### `PurchaseRequestService`

| Método | Recibe | Devuelve | Uso |
|---|---|---|---|
| `list(int $perPage = 15)` / `getDetail(int $id)` | — | Solicitudes con relaciones | Listados. |
| `createPurchaseRequest(array $items, string $reason, ?int $requestedBy = null): PurchaseRequest` | Ítems + motivo | `PurchaseRequest` creada | **API pública del contrato original**: `Inventory` la llama cuando detecta stock bajo; también usable manualmente desde el frontend. |
| `review(int $id, string $decision, ?int $reviewedBy, array $data = [])` | `decision` (`approved`/`rejected`) + datos de orden si aprueba | `PurchaseRequest` actualizada | Aprobar genera la `PurchaseOrder` real vía `PurchaseOrderService::create()`; rechazar solo cambia el estado. |

## 5. Endpoints REST expuestos

Definidos en `backend/app/Modules/Logistics/Routes/api.php`, bajo `/api/v1`:

- `suppliers` (CRUD completo) + `POST suppliers/{supplier}/evaluate` + `GET suppliers/{supplier}/purchase-orders`.
- `purchase-orders` (`index`, `store`, `show`) + `GET purchase-orders/pending-deliveries` + `POST purchase-orders/{purchase_order}/receive`.
- `purchase-requests` (`index`, `store`, `show`) + `POST purchase-requests/{purchase_request}/review`.

## 6. Eventos que emite

`PurchaseOrderReceived` (`app/Modules/Logistics/Events/PurchaseOrderReceived.php`) — se dispara al recibir una orden con calidad `approved`/`conditional`. Lleva la orden y sus ítems (`item_sku`, `quantity`). `Logistics` no escribe stock directamente: `insumos` pertenece a `Inventory`, que aún no existe en este repositorio — cuando exista, su listener debe incrementar el stock a partir de este evento.

## 7. Frontend expuesto

`frontend/src/modules/Logistics/index.ts` exporta `LogisticsModule` (componente de entrada, tab-switcher plano: Proveedores / Órdenes de Compra / Solicitudes — sin navegación tipo drill-down, a diferencia de `Planning`), `logisticsRoutes`, `logisticsService` y los tipos de dominio (`Supplier`, `PurchaseOrder`, `PurchaseRequest`, etc.). Otro módulo que necesite, por ejemplo, el nombre de un proveedor, importa `logisticsService` desde este barrel — nunca un archivo interno de `pages/` o `viewmodels/`.

## 8. Dependencias permitidas

`Logistics` → `Inventory` → `Shared`. `Logistics` **no** puede llamar a `Planning`, `Tasks` ni `Tracking` directamente. Hoy `Inventory` no existe todavía, así que `Logistics` solo depende de `Shared` (usuarios) en la práctica; `getSupplierByItem()` y el evento `PurchaseOrderReceived` quedan listos como los dos puntos de integración para cuando `Inventory` se implemente.

## 9. Consumido por

Ningún módulo depende de `Logistics` en el diseño actual; es un nodo hoja del grafo de dependencias.

## 10. Pendiente / a decidir en integración

- Confirmar con el dueño de `Inventory` si `createPurchaseRequest()` se dispara por evento (`Inventory` emite `LowStockDetected`, `Logistics` escucha) o por llamada directa a `LogisticsService` — no se decidió unilateralmente, ver regla de eventos de `01_ARCHITECTURE.md` §11.
- El esquema de las 7 tablas de este módulo es un borrador de trabajo (ver `docs/09_MASTER_PROMPTS/01_ADAPT_INDIVIDUAL_MODULE.md`); nombres/columnas quedan sujetos a revisión de integración, especialmente `item_sku` en `purchase_order_items`/`purchase_request_items`, que deberá convertirse en una FK real a `insumos` cuando `Inventory` exista.
