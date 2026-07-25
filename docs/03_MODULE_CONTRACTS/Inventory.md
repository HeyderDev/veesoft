> Versión: 1.3.0 · Última actualización: 2026-07-25 · Estado: Implementado e integrado
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del Módulo: Inventory (Inventario y Materiales)

**Propósito:** Gestiona el catálogo de herramientas y materiales (insumos), controla el stock actual, y registra todos los movimientos (entradas, salidas, ajustes, mantenimientos).

## 1. Eventos que Emite (Produce)

*(Ninguno definido actualmente)*

## 2. Eventos que Escucha (Consume)

*(Ninguno definido actualmente)*

## 3. API Pública (Servicios Expuestos)

Estos métodos están disponibles en `App\Modules\Inventory\Services\InventoryService` para ser inyectados por otros módulos (ej. Planning, Tasks, Logistics).

### 3.1. `getStockLevel(string $itemCode): int`
Consulta la cantidad actual disponible de un insumo (SKU).
- **$itemCode:** El SKU del insumo (ej. `INS-001`).
- **Retorna:** La cantidad en stock. `0` si el insumo no existe.

### 3.2. `reserveMaterials(array $items): bool`
Reserva materiales antes de una operación crítica (ej. iniciar una tarea, despachar). Genera movimientos de tipo `ADJUSTMENT`.
- **$items:** Un arreglo con el formato `[['sku' => 'INS-001', 'quantity' => 10, 'reason' => 'Opcional']]`.
- **Retorna:** `true` si se reservaron todos exitosamente, `false` si no hay stock suficiente para alguno de ellos (la operación se revierte atómicamente).

### 3.3. `registerConsumption(array $items, string $reason): void`
Registra el consumo de materiales luego de haber completado una operación. Delega a `reserveMaterials` bajo el capó.
- **$items:** Igual que `reserveMaterials`.
- **$reason:** La justificación del consumo que quedará registrada en el historial de movimientos (campo JSON `details.detalles`).

## 4. Dependencias

- **Shared:** Usa `App\Modules\Shared\Models\User` para los responsables de los movimientos. Usa la estructura base compartida (`BaseService`, `BaseApiController`, etc.).
