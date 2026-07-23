# 03_MODULE_CONTRACTS/Logistics.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Logistics

**Estado:** No implementado. Punto de partida para el compañero responsable de este módulo.

---

## 1. Responsabilidad

Gestión de compras y proveedores: solicitudes de aprovisionamiento, órdenes de compra, proveedores.

## 2. Entidades que debería poseer (propuesta inicial)

`Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseRequest`.

## 3. Servicios públicos que debería ofrecer

| Método propuesto | Para qué lo consumirían otros módulos |
|---|---|
| `createPurchaseRequest(array $items, string $reason): PurchaseRequest` | Se dispara cuando `Inventory` detecta stock bajo. |
| `getSupplierByItem(string $itemCode): ?Supplier` | Consulta rápida de proveedor preferido. |

## 4. Dependencias permitidas

`Logistics` → `Inventory` → `Shared`. `Logistics` **no** puede llamar a `Planning`, `Tasks` ni `Tracking` directamente.

## 5. Consumido por

Ningún módulo depende de `Logistics` en el diseño actual; es un nodo hoja del grafo de dependencias.

## 6. Antes de empezar

1. Confirma con el dueño de `Inventory` cómo se le notifica un stock bajo (evento vs. consulta directa vía Service — se decide entre ambos, no unilateralmente).
2. Sigue la estructura de `Planning` como plantilla.
3. Actualiza este documento con tu API real en cuanto exista.
