# 09_MASTER_PROMPTS/00_INDEX.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Prompts Maestros — Fase 2 (Integración del equipo)

Esta carpeta contiene los prompts que cada integrante usa para llevar su módulo desde su
proyecto individual (desconectado, en su propia tecnología) hasta quedar integrado en
`ERP-LASTENIA` respetando estrictamente la documentación de `/docs`.

El prompt de "construir el repositorio base" no está aquí porque ya se ejecutó — el
repositorio, la estructura de módulos y toda la documentación de `/docs` son su
resultado.

## Orden de uso

```
01_ADAPT_INDIVIDUAL_MODULE.md
        (Inventory, Logistics, Tasks, Tracking — en paralelo, cada quien en su rama)
                ↓
03_INFRASTRUCTURE_OWNER.md — Misión A (Shared: auth/permisos/auditoría)
        (idealmente primero o en paralelo con lo anterior; ver su propia nota de orden)
                ↓
02_INTEGRATE_MODULE.md
        (uno por uno, nunca en paralelo, orden coordinado por el Arquitecto)
                ↓
03_INFRASTRUCTURE_OWNER.md — Misión B (Synchronization)
        (solo cuando el esquema ya está mayormente consolidado)
```

## Documentos

| Prompt | Para quién | Qué hace |
|---|---|---|
| `01_ADAPT_INDIVIDUAL_MODULE.md` | Cada dueño de módulo (Inventory, Logistics, Tasks, Tracking) | Reconstruye su proyecto anterior dentro de la estructura oficial, de forma autocontenida |
| `02_INTEGRATE_MODULE.md` | Cada dueño de módulo, cuando le toca su turno | Fusiona su módulo ya adaptado con `develop`, reconcilia esquema y resuelve dependencias cruzadas |
| `03_INFRASTRUCTURE_OWNER.md` | El responsable de bases de datos distribuidas | Misión A: completa `Shared` (auth, permisos, auditoría). Misión B: construye `Synchronization` |

Cada prompt referencia los documentos de `docs/02_DEVELOPMENT_GUIDE/` y
`docs/03_MODULE_CONTRACTS/` como fuente de verdad — si algo en un prompt contradice esos
documentos, prevalecen los documentos (ver `docs/07_PROJECT_RULES.md` §4).
