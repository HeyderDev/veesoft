# 06_AI_CONTEXT.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contexto para Agentes de IA — léeme primero

Este documento es el resumen que cualquier agente de IA (Claude, GPT, Gemini, Antigravity, Cursor u otro) debe leer antes de generar código para ERP Lastenia. Si tienes espacio de contexto limitado y solo puedes leer un archivo, es este. Si puedes leer más, sigue los enlaces.

---

## Qué es este proyecto

ERP Lastenia es un sistema de gestión para el Vivero de Cacao de la ULEAM (Extensión El Carmen), desarrollado como proyecto de titulación por un equipo de seis estudiantes. Cada integrante construye un módulo funcional; todos conviven en un único monolito modular (un solo backend Laravel, un solo frontend React), no en microservicios ni proyectos separados.

Documento completo: `docs/00_PROJECT_BRIEF.md`.

## Arquitectura en una frase

```
React + Vite + Tailwind (MVVM)  →  API REST Laravel  →  Services  →  Repositories  →  MySQL  →  (Eventos) → Synchronization
```

Un único proyecto Frontend, un único proyecto Backend, una única base de datos por nodo, organizados internamente por módulos (`app/Modules/<Modulo>`, `src/modules/<Modulo>`). Documento completo: `docs/01_ARCHITECTURE.md`.

## Módulos del sistema y su estado

| Módulo | Estado | Responsabilidad |
|---|---|---|
| `Planning` | Implementado (referencia) | Metas → Planes → Ciclos → Lotes → Fases → Cronograma |
| `Shared` | Parcial | Users, Roles, clases base, layout, componentes UI genéricos |
| `Synchronization` | No implementado | Sincronización entre nodos (Administrador ↔ Central ↔ Móvil) |
| `Inventory` | No implementado | Herramientas, insumos, materiales |
| `Logistics` | No implementado | Compras y proveedores |
| `Tasks` | No implementado (tabla provisional en Planning) | Tareas operativas |
| `Tracking` | No implementado (tablas provisionales en Planning) | Seguimiento, clima, alertas, historial |

Contrato detallado de cada uno: `docs/03_MODULE_CONTRACTS/<Modulo>.md` — **léelo antes de tocar ese módulo**.

## Reglas no negociables

1. Un módulo nunca accede al `Repository` de otro módulo — solo a su `Service` público.
2. Controllers y componentes React nunca contienen lógica de negocio.
3. Toda consulta a base de datos vive en un `Repository`.
4. Todo cambio de esquema es una migración versionada, coordinada con el dueño de la tabla.
5. Ningún módulo implementa su propia sincronización — dispara eventos, `Synchronization` los escucha.
6. Código en inglés, interfaz de usuario en español.
7. No se crean microservicios, Single SPA, segundos proyectos React/Laravel, ni se instalan librerías de estado/estilo nuevas sin aprobación.

Lista completa y exhaustiva: `docs/02_DEVELOPMENT_GUIDE/05_AI_RULES.md` y `docs/07_PROJECT_RULES.md`.

## Dónde mirar antes de escribir código

| Necesito... | Leo... |
|---|---|
| Crear un módulo nuevo | `docs/02_DEVELOPMENT_GUIDE/01_MODULE_CREATION.md` |
| Escribir backend (Controller/Service/Repository) | `docs/02_DEVELOPMENT_GUIDE/02_BACKEND_GUIDE.md` |
| Escribir frontend (Page/ViewModel/Service) | `docs/02_DEVELOPMENT_GUIDE/03_FRONTEND_GUIDE.md` |
| Cambiar el esquema de base de datos | `docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md` |
| Ver un ejemplo real ya funcionando | `docs/02_DEVELOPMENT_GUIDE/07_EXAMPLES.md` y el código de `Planning` |
| Saber qué puede exponer/consumir mi módulo | `docs/03_MODULE_CONTRACTS/<MiModulo>.md` |
| Nombrar cosas | `docs/05_CODING_STANDARDS.md` |
| Hacer commits/PR | `docs/04_GIT_WORKFLOW.md` |
| Saber si terminé la tarea | `docs/08_DEFINITION_OF_DONE.md` |

## El ejemplo de referencia es real código, no pseudocódigo

`backend/app/Modules/Planning` y `frontend/src/modules/Planning` están implementados y funcionando (migraciones corridas, tests en verde, build de frontend limpio). Cuando esta documentación describe un patrón, ese patrón existe literalmente en esos archivos — cópialo, no lo reinterpretes.

## Si un prompt te dice solamente "lee la documentación y respétala"

Significa exactamente el flujo de esta tabla: brief → arquitectura → contrato de tu módulo → guía de desarrollo → ejemplos reales de Planning. No hace falta que se repitan las reglas en el prompt — ya están aquí, y prevalecen sobre cualquier suposición que hagas por tu cuenta.
