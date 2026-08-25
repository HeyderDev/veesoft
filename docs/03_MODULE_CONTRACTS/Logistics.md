# 03_MODULE_CONTRACTS/Logistics.md

> Versión: 2.4.0 · Última actualización: 2026-08-24 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Logistics

**Estado:** Implementado e integrado.
**Ubicación:** `backend/app/Modules/Logistics`, `frontend/src/modules/Logistics`.
**Responsable:** Juan (adaptado desde el proyecto individual `sistema/`, Node/Express + PostgreSQL).

---

## 1. Responsabilidad

Gestión de compras y proveedores: órdenes de compra, proveedores.

## 2. Entidades que posee

`Supplier`, `SupplierEvaluation`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseReceipt`.

`Logistics` no tiene (ni tuvo desde el 2026-08-24) un concepto propio de "meta": el reporte de gasto en compras reutiliza la `ProductionGoal` (Meta de Producción) que ya existe en `Planning` — ver §4 (`PurchaseOrderService::spendReport()`) y §7.

**Retirado (2026-08-24)**: `PurchaseRequest`/`PurchaseRequestItem` ("Solicitud de aprovisionamiento") existieron entre el 2026-07-25 y esta fecha para cumplir el contrato original (`createPurchaseRequest`, pensado para dispararse cuando `Inventory` detectara stock bajo) más un flujo manual de aprobación. Se quitaron por completo (modelos, controller, service, repositorio, requests, rutas, migraciones de retiro, páginas/viewmodel del frontend) porque nunca tuvieron consumidor real: `Inventory` nunca llegó a llamar `createPurchaseRequest()` (era justamente la decisión pendiente en §10) y el flujo manual quedaba de más frente a que Admin ya crea la `PurchaseOrder` directamente. Las tablas `purchase_requests`/`purchase_request_items` se eliminaron vía `database/migrations/2026_08_24_040000_drop_purchase_requests_tables.php` (no se borraron las migraciones de creación originales, para no reescribir historial ya aplicado en bases reales).

## 3. Reglas de negocio implementadas

Portadas desde `sistema/` y verificadas contra su lógica original (triggers de PostgreSQL, controllers, tests):

- **Proveedor**: RUC/Cédula validado con el algoritmo oficial de Ecuador (módulo 10/11 del SRI/Registro Civil), único (`ValidatesEcuadorianTaxId`). El `score` (0.00–5.00) nunca lo asigna el usuario al crearlo o editarlo: arranca en `SupplierService::MAXIMUM_SCORE` (5.00) y luego es siempre el promedio ponderado de sus evaluaciones — calidad 40% + puntualidad 30% + precio 20% + servicio postventa 10% (`cumplimiento` se guarda pero no participa, igual que en el sistema anterior). En `sistema/` este cálculo lo hacía un trigger de PostgreSQL; aquí lo recalcula `SupplierService::recalculateScore()` dentro de una transacción cada vez que se registra una evaluación nueva, porque MySQL/Eloquent no tiene ese trigger. También expone `certificate_expires_at`/`organic_certified`: `SupplierService::certificateAlerts()` avisa (`expired`/`due_soon`) cuando un certificado orgánico está vencido o vence dentro de N días.
- **Catálogo proveedor↔ítem**: tablas pivote `supplier_supply`/`supplier_tool` (FK a `Inventory\Models\Supply`/`Tool`, `unit_price` por proveedor). `SupplierService::syncCatalog()` valida que cada ítem exista en el vivero activo antes de asociarlo; nunca crea un `Supply`/`Tool` nuevo — esos los crea exclusivamente `Inventory`. Es el catálogo del que se eligen los ítems al armar una `PurchaseOrder`. La unicidad de `items.*.item_id` en `UpdateSupplierCatalogRequest` se valida sobre el par (`item_type`, `item_id`), no sobre `item_id` aislado (`withValidator`) — **corregido 2026-08-24**: un `Supply` y un `Tool` son tablas independientes y pueden compartir el mismo ID, así que la regla `distinct` de Laravel sobre `item_id` solo rechazaba de forma incorrecta catálogos válidos con esa coincidencia.
- **Orden de compra**: solo se puede emitir a un proveedor `active`. El score bajo (< `SupplierService::MINIMUM_SCORE_FOR_ORDERS`, 3.00) **ya no bloquea la orden** (retirado 2026-08-24, a pedido del negocio) — el frontend sigue advirtiendo "⚠ Este proveedor no cumple el score mínimo..." al elegir uno así, pero es solo informativo; Admin puede continuar. Sin fecha de entrega, se asume hoy + 5 días. El total es la suma de cantidad × precio unitario de cada ítem. `order_number` es siempre autogenerado por `PurchaseOrderRepository::nextOrderNumber()` (correlativo `"1"`, `"2"`, ...) — el cliente no puede fijarlo. Cada ítem se referencia por `item_type`/`item_id` contra el catálogo del proveedor (`supplier_supply`/`supplier_tool`); `PurchaseOrderItem` guarda `supply_id`/`tool_id` como FK real más una copia (`item_sku`, `item_name`, `unit`, `unit_price`) tomada del catálogo en el momento de crear la orden — ya no hay ruta que acepte ítems como texto libre sin FK.
- **Recepción**: una orden solo se puede recibir una vez. Con calidad `approved`/`conditional` la orden pasa a `received` y se dispara `PurchaseOrderReceived` (pendiente de que algo lo escuche y actualice stock en `Inventory`, ver §6); con `rejected` pasa a `cancelled`. La temperatura del sustrato fuera de 18–24°C es solo una advertencia informativa, no bloquea la recepción (igual que en `sistema/`).
- **Ítems sin orden registrada**: `PurchaseOrderService::unregisteredItems()` lista los `Supply` y `Tool` de `Inventory` que nunca aparecieron en un `purchase_order_items` (`whereDoesntHave('purchaseOrderItems')`), para avisar en el panel de Órdenes de Compra. Cada ítem incluye el `supplier_id` de un proveedor que ya lo tiene en catálogo (si existe alguno), para que el frontend decida si el click abre "Nueva Orden" preseleccionada o pide vincular el catálogo de un proveedor; y la `quantity` ya registrada en `Inventory` (`current_stock` del `Supply`, o el conteo de `ToolUnit` del `Tool`) — **2026-08-24**: la orden que reconcilia este aviso debe emitirse por esa misma cantidad exacta, así que el frontend abre "Nueva Orden" con esa cantidad fija y no editable (`openCreateForItem`/`quantityLocked` en `usePurchaseOrdersViewModel.ts`), para que lo comprado siempre cuadre con lo que ya está físicamente en inventario.
- **Pendientes por llegar**: cada ítem de una orden `issued`/`sent` se clasifica por urgencia según su fecha de entrega estimada: `red` si ya venció, `yellow` si es mañana, `green` en otro caso.

## 4. Servicios públicos

### `SupplierService`

| Método | Recibe | Devuelve | Uso |
|---|---|---|---|
| `list(int $perPage = 15)` | — | Página de `Supplier`, ordenada por score descendente | Listado del directorio de proveedores. |
| `getDetail(int $id)` | ID | `Supplier` con relaciones | Detalle de un proveedor. |
| `create(array $data)` | Datos del proveedor | `Supplier` creado | Alta de proveedor (valida RUC/CI, score inicial 5.00). |
| `update(int $id, array $data)` | ID + datos | `Supplier` actualizado | Edición (re-valida RUC/CI solo si cambió). |
| `evaluate(int $supplierId, array $data)` | ID + criterios de evaluación | `Supplier` con score recalculado | Registra evaluación y recalcula el score ponderado. |
| `getSupplierByItem(string $itemSku): ?Supplier` | SKU de un ítem | Proveedor mejor calificado que históricamente lo ha suministrado, o `null` | **Pensado para que `Inventory` lo consuma** al decidir a quién comprar — sigue sin consumidor, ver §10. |
| `catalog(int $supplierId)` / `syncCatalog(int $supplierId, array $items)` | ID (+ items `item_type`/`item_id`/`unit_price` al sincronizar) | Catálogo del proveedor (supplies+tools con `unit_price`) | Alimenta el selector de ítems al armar una orden de compra. |
| `certificateAlerts(int $days = 30)` | Ventana de días | Proveedores con certificado orgánico vencido o por vencer | Banner de alerta en Proveedores. |
| `spendSummary(): array` | — | `{ total_suppliers, suppliers: [{ supplier_id, supplier_name, status, orders_count, total_spent }] }` | Reporte de Proveedores: todos los del vivero activo (incluso sin órdenes) con el `total` histórico de sus `PurchaseOrder` no `cancelled`, sin acotar a ningún período. |

### `PurchaseOrderService`

| Método | Recibe | Devuelve | Uso |
|---|---|---|---|
| `list(int $perPage = 15)` / `getDetail(int $id)` / `listForSupplier(int $supplierId, int $perPage = 15)` | — | Órdenes con relaciones | Listados. |
| `create(array $data)` | `supplier_id`, `estimated_delivery_date?`, `items[]` (`item_type`, `item_id`, `quantity`) | `PurchaseOrder` creada | Genera una orden (valida solo que el proveedor esté activo — el score bajo ya no bloquea, ver §3). `order_number` siempre se autogenera; cada ítem debe existir en el catálogo del proveedor o se rechaza (`DomainException`). |
| `receive(int $orderId, array $data)` | `quality_status`, `substrate_temperature?`, `observations?`, `photo_evidence_url?` | `{receipt, order, temperature_warning}` | Registra la recepción (HU-06). |
| `pendingDeliveries(): array` | — | Ítems pendientes clasificados por urgencia | Alimenta el panel "Insumos por Llegar". |
| `unregisteredItems(): array` | — | `Supply`+`Tool` de `Inventory` sin ningún `purchase_order_items` asociado, con `supplier_id` si ya está en algún catálogo | Alimenta el aviso "Ítems sin orden de compra" del panel de Órdenes. |
| `spendReport(Carbon $start, Carbon $end, string $label): array` | Rango de fechas + etiqueta | `{ label, start_date, end_date, total_spent, orders_count, suppliers[] }` | Reporte de gasto: suma el `total` de las `PurchaseOrder` no `cancelled` emitidas (`issued_at`) en el rango, agrupado por proveedor. El rango lo decide quien llama — el Service no sabe si viene de un año completo o de una Meta de Producción de Planning. |
| `annualSpendReport(int $year): array` | Año | Mismo shape que `spendReport()` | 1/enero al 31/diciembre del año dado. |

## 5. Endpoints REST expuestos

Definidos en `backend/app/Modules/Logistics/Routes/api.php`, bajo `/api/v1`:

- `suppliers` (CRUD completo) + `POST suppliers/{supplier}/evaluate` + `GET suppliers/{supplier}/purchase-orders` + `GET/PUT suppliers/{supplier}/catalog` + `GET suppliers-certificates/alerts` + `GET suppliers-spend-summary`.
- `purchase-orders` (`index`, `store`, `show`) + `GET purchase-orders/pending-deliveries` + `GET purchase-orders/unregistered-items` + `POST purchase-orders/{purchase_order}/receive`.
- `GET purchase-orders/spend-report` (`role:Admin`) — `?year=` para el reporte anual, o `?start_date=&end_date=&label=` para un rango arbitrario (p.ej. el de una Meta de Producción de Planning, resuelto por el frontend — ver §7).

No existe (ni existió) un endpoint para fijar `order_number` manualmente — `GET purchase-orders/next-number` se retiró en la normalización del 2026-08-23. `purchase-requests` (`index`/`store`/`show`/`{id}/review`) existió hasta el 2026-08-24 — ver §2.

## 6. Eventos que emite

`PurchaseOrderReceived` (`app/Modules/Logistics/Events/PurchaseOrderReceived.php`) — se dispara al recibir una orden con calidad `approved`/`conditional`. Lleva la orden y sus ítems (`item_sku`, `quantity`). `Logistics` no escribe stock directamente: `insumos` pertenece a `Inventory`. `Inventory` ya existe en el repositorio (integrado antes que `Logistics`), pero **todavía no hay ningún listener registrado para este evento** — sigue pendiente que `Inventory` (o `Synchronization`) lo escuche e incremente el stock correspondiente.

## 7. Frontend expuesto

`frontend/src/modules/Logistics/index.ts` exporta `LogisticsModule` (componente de entrada, tab-switcher plano: **Panorama** / Proveedores / Compras — sin navegación tipo drill-down por viveros, a diferencia de `Planning`), `LogisticsNavProvider`/`useLogisticsNav` (`hooks/useLogisticsNav.tsx`), `LogisticsSidebarSections`, `logisticsRoutes`, `logisticsService` y los tipos de dominio (`Supplier`, `PurchaseOrder`, etc.). Otro módulo que necesite, por ejemplo, el nombre de un proveedor, importa `logisticsService` desde este barrel — nunca un archivo interno de `pages/` o `viewmodels/`.

**2026-08-24**: la sección activa (`planning-overview`/`suppliers`/`purchases`) se movió de `useState` local en `LogisticsTabs` a `useLogisticsNav` (contexto compartido), y `layouts/modulesRegistry.tsx` registra `NavProvider: LogisticsNavProvider` + `SidebarSections: LogisticsSidebarSections` para el módulo — mismo patrón que Planning/Tasks/Inventory (`layouts/AdminLayout.tsx` monta el `NavProvider` del módulo activo envolviendo Sidebar + contenido). Esto hace que el Sidebar despliegue las 3 secciones de Logística bajo su entrada mientras el módulo está activo (empujando hacia abajo los módulos de debajo, como Planning/Tasks/Inventory), sincronizadas con el tab-switcher del contenido principal — antes esa sección vivía aislada dentro de `LogisticsTabs` y el Sidebar no mostraba nada al expandir Logística.

La pestaña **Compras** (`components/LogisticsTabs.tsx`) muestra únicamente `PurchaseOrdersPage` (Órdenes) — **hasta el 2026-08-24** apilaba también `PurchaseRequestsPage` (Solicitudes) encima, con un `refreshSignal` entre ambas para refrescar Órdenes tras aprobar una Solicitud; se quitó junto con el resto de `PurchaseRequest` (ver §2) por no tener consumidor real, y esa plumbing de `refreshSignal` se retiró de `PurchaseOrdersPage`/`usePurchaseOrdersViewModel` al quedar sin usarse.

Hay dos reportes distintos, cada uno en su propia pestaña (**2026-08-24**, separados tras probar un único panel compartido — el usuario pidió que Proveedores mostrara un reporte de proveedores, no de compras):

- `components/PurchaseSpendReportPanel.tsx`, solo en `PurchaseOrdersPage.tsx` (pestaña **Compras**): reporte de gasto acotado a **la Meta de Producción actual** del vivero activo (la que sigue sin culminar, `finished_at === null`, buscada entre `planningService.getGoals()` — importado directo del barrel de `Planning`, mismo patrón que `usePlanningOverviewViewModel.ts`), con su rango resuelto como `created_at` → "hoy" y pasado a `GET purchase-orders/spend-report?start_date=&end_date=&label=` (`viewmodels/usePurchaseSpendReportViewModel.ts`). Si no hay una meta en curso, el panel lo indica y no pide el reporte. Incluye un botón "Descargar CSV" que arma el archivo en el cliente (sin endpoint propio) a partir de los mismos datos que ya se muestran en pantalla.
- `components/SupplierSpendReportPanel.tsx`, solo en `SuppliersPage.tsx` (pestaña **Proveedores**): reporte de proveedores — cuántos hay registrados y cuánto se le ha comprado a cada uno **históricamente, sin acotar a ningún período** (`viewmodels/useSupplierSpendReportViewModel.ts` → `GET suppliers-spend-summary` → `SupplierService::spendSummary()`). Lista todos los proveedores del vivero activo, incluso los que aún no tienen ninguna orden (`total_spent: "0.00"`).

Ambos son `role:Admin` y ninguno se renderiza para Operario (`isAdmin` en el componente). El endpoint `purchase-orders/spend-report` sigue soportando `?year=` como capa genérica de reporte por rango — no es exclusivo del panel de Compras — pero ningún frontend de Logistics lo consume hoy; quedó sin llamador tras quitar el selector de la primera iteración del panel.

La pestaña **Panorama** (`pages/PlanningOverviewPage.tsx` + `viewmodels/usePlanningOverviewViewModel.ts`, pestaña por defecto del módulo) cruza planificación, actividades pendientes e insumos en riesgo para que Logística anticipe compras. Se implementó **enteramente en el frontend**: el viewmodel importa `planningService`, `tasksService` e `inventoryService` directamente desde los barrels de esos módulos (mismo patrón ya usado por `Planning/viewmodels/useResumenViewModel.ts` al consumir `trackingService`) y compone los datos en el cliente. El backend de `Logistics` no cambia por esto — sigue sin ninguna referencia a `Planning`/`Tasks` (confirmado por grep en la integración), así que la restricción de la sección 8 sigue cumpliéndose a nivel de Services/Repositories de backend. Si se prefiere prohibir también esta composición a nivel de frontend, hay que decidirlo explícitamente y actualizar esta sección — hoy no está prohibida porque solo consume endpoints públicos ya expuestos por esos módulos.

**Corregido 2026-08-24** — "Insumos en Riesgo" ignoraba la `quantity` que cada tarea pide de un insumo (el tipo local `PlanningTaskRaw` ni siquiera la declaraba, aunque `Tasks` sí la devuelve en `resources`): solo marcaba un insumo como crítico si `current_stock <= min_stock`, sin importar cuánto pedían las tareas pendientes. Un insumo con stock por encima del mínimo pero muy por debajo de lo que las tareas pendientes necesitan (ej. 4 en stock, 81 pedidos entre las tareas) no se marcaba como en riesgo — bug de `Logistics`, no de `Tasks` (los datos ya llegaban completos). Ahora `isCritical` también compara el stock actual contra la **suma de `quantity`** de ese insumo en todas las tareas `pending`/`type=lot` (no solo la de una tarea aislada), y las tarjetas de insumo en "Actividades Pendientes" muestran la cantidad pedida.

## 8. Dependencias permitidas

`Logistics` → `Inventory` → `Shared`. `Logistics` **no** puede llamar a `Planning`, `Tasks` ni `Tracking` directamente **en su backend** (Services/Repositories/Models) — verificado sin resultados: `grep -rn 'Modules\\Planning\|Modules\\Tasks\|Modules\\Tracking' backend/app/Modules/Logistics`.

`Logistics` **sí** consume `Inventory` en la práctica desde la normalización del 2026-08-23 (referencia directa a `App\Modules\Inventory\Models\{Supply,Tool}`, sin `use`, en `SupplierService`, `PurchaseOrderService` y en las relaciones `belongsTo`/`belongsToMany` de `Supplier`, `PurchaseOrderItem`): el catálogo proveedor↔ítem (`supplier_supply`/`supplier_tool`), las FK `supply_id`/`tool_id` en órdenes, y `unregisteredItems()` leen `Supply`/`Tool` directamente. Quedan dos puntos de integración genuinamente pendientes (ver §10): `getSupplierByItem()` sin consumidor desde `Inventory`, y `PurchaseOrderReceived` sin listener.

Las excepciones documentadas a "no Planning/Tasks" son ambas de frontend, nunca de backend (ver sección 7): la pestaña **Panorama** y `PurchaseSpendReportPanel` (resuelve la Meta de Producción actual para el reporte de gasto de Compras) — las dos componen datos en el cliente vía los servicios públicos de `Planning`, no vía el backend de `Logistics`. `SupplierSpendReportPanel` (reporte de Proveedores) no tiene esta excepción — no consume `Planning`.

## 9. Consumido por

Ningún módulo depende de `Logistics` en el diseño actual; es un nodo hoja del grafo de dependencias.

## 10. Pendiente / a decidir en integración

- `Inventory` ya está integrado — queda pendiente decidir con su responsable quién escucha `PurchaseOrderReceived` para incrementar stock. No se decide unilateralmente, ver regla de eventos de `01_ARCHITECTURE.md` §11.
- ~~`Inventory` ya está integrado — queda pendiente decidir con su responsable si `createPurchaseRequest()` se dispara por evento...~~ — **resuelto (2026-08-24)**: se retiró `PurchaseRequest` por completo (ver §2) en vez de decidir cómo dispararlo; nunca tuvo consumidor real.
- ~~`item_sku` en `purchase_order_items`/`purchase_request_items` sigue siendo una copia autocontenida... pendiente de esa decisión conjunta con `Inventory`~~ — **resuelto (2026-08-23)**: `purchase_order_items` tiene `supply_id`/`tool_id` como FK real a `Inventory`, resueltos contra el catálogo del proveedor. `item_sku`/`item_name`/`unit` se conservan como copia (no como fuente de verdad) para no repetir el join en cada listado.
- **Resuelto (2026-08-23)**: se retiró la rama de `PurchaseOrderService::create()` que aceptaba ítems sin `item_type`/`item_id` (texto libre), y el campo `order_number` que el formulario de "aprobar Solicitud" seguía enviando sin usarlo (`GET purchase-orders/next-number`, `getNextOrderNumber()` del frontend — ese formulario ya no existe, ver §2). Ya no queda ninguna ruta, validada o no, que cree una orden sin FK a `Inventory` o con número de orden manual.
- **Deuda pendiente introducida por lo anterior**: `backend/tests/Feature/LogisticsCrudTest.php` sigue armando órdenes con ítems de texto libre (`item_name`/`unit`/`unit_price` sin `item_type`/`item_id`) y fijando `order_number` a mano — ese shape ya no pasa la validación de `CreatePurchaseOrderRequest`. Hay que reescribirlo contra el contrato FK-based (crear `Supply`/`Tool` vía `Inventory`, adjuntarlos al catálogo del proveedor con `PUT suppliers/{id}/catalog`, y recién ahí pedir la orden). El test de Solicitud de aprovisionamiento que tenía este mismo archivo se quitó junto con la funcionalidad (§2), no como parte de esta deuda.
- **Bloqueador no relacionado para correr tests localmente**: la migración `2026_08_23_070000_add_vivero_id_to_tool_units_table.php` (módulo `Inventory`) usa sintaxis MySQL-only (`UPDATE tool_units tu INNER JOIN tools t ...`), que rompe con `sqlite`/`:memory:` (el driver que usa `phpunit.xml` para tests). Esto hace fallar la suite completa (no solo `Logistics`) antes de llegar al cuerpo de cualquier test — confirmado corriendo `php artisan test --filter=LogisticsCrudTest` y, de nuevo el 2026-08-24, con `php artisan test --filter=PurchaseOrderSpendReportTest`. No es parte de este módulo; coordinar con quien mantiene `Inventory`. Mientras siga sin resolverse, `PurchaseOrderSpendReportTest.php` (reporte de gasto en compras) tampoco puede correr localmente — se verificó en su lugar con `php artisan tinker` contra la base de datos real de desarrollo (MySQL), `php artisan route:list` y Pint.
- Verificación de integración (Prompt Maestro 02, 2026-07-26): reconciliación de esquema sin colisiones, límites de módulo sin violaciones (grep limpio), 45/45 tests del sistema consolidado en verde, `tsc -b`/`vite build` limpios, Pint limpio en `Logistics` (2 archivos de otros módulos quedaron con hallazgos de estilo preexistentes, no tocados). Ese conteo de tests en verde es anterior a la normalización del 2026-08-23 y al bloqueador de sqlite descrito arriba — no refleja el estado actual de la suite. Falta: push de la rama `logistica` a `origin` (bloqueado por permisos de repositorio) y verificación visual manual del Sidebar/navegación en navegador.
