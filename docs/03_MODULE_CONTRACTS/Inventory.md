# 03_MODULE_CONTRACTS/Inventory.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Inventory

**Estado:** No implementado. Este documento es el punto de partida para el compañero responsable de este módulo — léelo junto con `docs/02_DEVELOPMENT_GUIDE/01_MODULE_CREATION.md` antes de escribir código.

---

## 1. Responsabilidad

Control de herramientas, insumos y materiales del vivero: existencias, entradas, salidas y disponibilidad.

## 2. Entidades que debería poseer (propuesta inicial — ajustar con el Arquitecto antes de migrar)

`InventoryItem` (herramienta/insumo/material), `InventoryCategory`, `InventoryMovement` (entrada/salida), `InventoryStock` (existencia actual por ítem).

## 3. Servicios públicos que debería ofrecer

Pensado como servicios, no como CRUD expuesto sin más (ver filosofía en `01_ARCHITECTURE.md` §"Trabajar por servicios"):

| Método propuesto | Para qué lo consumirían otros módulos |
|---|---|
| `getStockLevel(string $itemCode): int` | `Logistics` decide si hace falta comprar. |
| `reserveMaterials(array $items): bool` | `Planning`/`Tasks` reservan insumos para una fase (por ejemplo, sustrato para la fase de Preparación). |
| `registerConsumption(array $items, string $reason): void` | Registrar consumo real durante una fase. |

## 4. Dependencias permitidas

`Inventory` → `Shared` únicamente al inicio. `Logistics` dependerá de `Inventory` (no al revés) — ver sección siguiente.

## 5. Consumido por

- `Logistics` (para saber qué reponer).
- Potencialmente `Planning`/`Tasks` cuando una fase requiera reservar insumos — esa integración se define cuando ambos módulos existan, no antes.

## 6. Antes de empezar

1. Confirma con el Arquitecto el naming final de las entidades (esta lista es una propuesta, no una decisión cerrada).
2. Sigue exactamente la estructura de carpetas de `Planning` (`docs/02_DEVELOPMENT_GUIDE/01_MODULE_CREATION.md`).
3. Actualiza este documento con los métodos reales de tu `InventoryService` en cuanto los implementes — es la referencia que usarán los demás.
