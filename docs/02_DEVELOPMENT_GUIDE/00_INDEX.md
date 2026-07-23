# 02_DEVELOPMENT_GUIDE/00_INDEX.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Manual Oficial de Desarrollo
## Índice General y Guía de Uso

**Documento:** 00_INDEX.md

**Versión:** 1.0.0

**Estado:** Oficial

**Ubicación:** `/docs/02_DEVELOPMENT_GUIDE`

---

# Introducción

Este directorio constituye el **Manual Oficial de Desarrollo** del proyecto ERP Lastenia.

Su propósito es definir los procedimientos, metodologías, convenciones y buenas prácticas que deberán seguir todos los desarrolladores y agentes de Inteligencia Artificial durante el desarrollo del sistema.

Este manual complementa la arquitectura definida en:

```

docs/01_ARCHITECTURE.md

```

Mientras el documento de arquitectura responde **"Cómo está construido el sistema"**, este manual responde **"Cómo debe desarrollarse el sistema"**.

---

# Objetivos

Este manual tiene los siguientes objetivos:

- Estandarizar el desarrollo del proyecto.
- Evitar diferencias de estilo entre desarrolladores.
- Mantener una arquitectura consistente.
- Facilitar la incorporación de nuevos integrantes.
- Guiar el desarrollo realizado por Inteligencias Artificiales.
- Reducir conflictos durante la integración de módulos.
- Garantizar la mantenibilidad del código.

---

# Alcance

Todas las reglas descritas en este directorio son obligatorias para:

- Desarrolladores del proyecto.
- Agentes de IA.
- Contribuciones futuras.
- Nuevos módulos.
- Refactorizaciones.

No se permiten excepciones sin aprobación del Arquitecto del Proyecto.

---

# Organización del Manual

Este directorio está dividido en varios documentos especializados.

Cada documento aborda una única responsabilidad.

```

02_DEVELOPMENT_GUIDE/

│

├── 00_INDEX.md

├── 01_MODULE_CREATION.md

├── 02_BACKEND_GUIDE.md

├── 03_FRONTEND_GUIDE.md

├── 04_DATABASE_GUIDE.md

├── 05_AI_RULES.md

├── 06_CHECKLISTS.md

└── 07_EXAMPLES.md

```

---

# Descripción de cada documento

## 01_MODULE_CREATION.md

Explica paso a paso cómo crear un nuevo módulo dentro del ERP.

Incluye:

- estructura
- responsabilidades
- carpetas
- integración
- rutas
- servicios
- convenciones

---

## 02_BACKEND_GUIDE.md

Define las normas oficiales para desarrollar el Backend en Laravel.

Incluye:

- Controllers
- Services
- Repositories
- Requests
- Resources
- Policies
- DTO
- Events
- Listeners
- Jobs

Además establece qué responsabilidades tiene cada capa y qué prácticas están prohibidas.

---

## 03_FRONTEND_GUIDE.md

Describe cómo construir correctamente un módulo React siguiendo el patrón MVVM.

Incluye:

- Pages
- Components
- ViewModels
- Hooks
- Services
- Routing
- Estados
- Comunicación con API

---

## 04_DATABASE_GUIDE.md

Especifica las reglas oficiales para el desarrollo de la base de datos.

Incluye:

- Migraciones
- Seeders
- Relaciones
- Índices
- Convenciones
- Soft Deletes
- UUID
- Versionado del esquema

---

## 05_AI_RULES.md

Documento especialmente diseñado para agentes de Inteligencia Artificial.

Contiene reglas obligatorias sobre:

- qué pueden hacer
- qué no pueden hacer
- cómo interpretar la arquitectura
- cómo generar código consistente

Este documento deberá ser leído antes de cualquier generación automática de código.

---

## 06_CHECKLISTS.md

Contiene listas de verificación oficiales del proyecto.

Ejemplos:

Antes de crear un módulo.

Antes de hacer Commit.

Antes de Pull Request.

Antes de Merge.

Antes del despliegue.

---

## 07_EXAMPLES.md

Incluye ejemplos completos de implementación siguiendo todas las normas del proyecto.

Estos ejemplos servirán como referencia para desarrolladores e Inteligencias Artificiales.

---

# Orden de Lectura Recomendado

Para nuevos integrantes del proyecto.

1. 00_PROJECT_BRIEF.md

2. 01_ARCHITECTURE.md

3. 00_INDEX.md

4. 01_MODULE_CREATION.md

5. 02_BACKEND_GUIDE.md

6. 03_FRONTEND_GUIDE.md

7. 04_DATABASE_GUIDE.md

8. 05_AI_RULES.md

9. 06_CHECKLISTS.md

10. 07_EXAMPLES.md

---

# Flujo de Desarrollo

Todo nuevo desarrollo deberá seguir el siguiente proceso.

```

Leer documentación

↓

Comprender arquitectura

↓

Crear rama

↓

Implementar módulo

↓

Auto revisión

↓

Checklist

↓

Commit

↓

Pull Request

↓

Code Review

↓

Merge

```

No se permitirá desarrollar funcionalidades sin haber revisado previamente la documentación correspondiente.

---

# Filosofía del Desarrollo

El proyecto ERP Lastenia busca mantener una arquitectura profesional basada en los siguientes principios.

- Código limpio.
- Modularidad.
- Bajo acoplamiento.
- Alta cohesión.
- Responsabilidad única.
- Reutilización.
- Escalabilidad.
- Legibilidad.
- Mantenibilidad.

Toda decisión técnica deberá respetar estos principios.

---

# Uso de Inteligencia Artificial

Las herramientas de Inteligencia Artificial forman parte oficial del proceso de desarrollo del proyecto.

Su utilización está permitida siempre que:

- respeten la arquitectura definida;
- sigan este Manual de Desarrollo;
- no generen estructuras alternativas;
- no modifiquen módulos ajenos;
- produzcan código consistente con el resto del sistema.

Las IA deben entenderse como asistentes de desarrollo, no como responsables del diseño arquitectónico.

Toda decisión de arquitectura corresponde exclusivamente al equipo de desarrollo.

---

# Prioridad de la Documentación

En caso de conflicto entre documentos, se seguirá el siguiente orden de prioridad.

1. 01_ARCHITECTURE.md

2. DEVELOPMENT_GUIDE

3. PROJECT_RULES

4. CODING_STANDARDS

5. Comentarios del código

6. Implementación existente

---

# Convención General

Durante todo el proyecto se utilizará la siguiente regla:

> **La arquitectura nunca se adapta al código; el código siempre deberá adaptarse a la arquitectura.**

Esta filosofía garantiza que el ERP conserve una estructura consistente durante todo su ciclo de vida.

---

# Objetivo Final

El propósito de este Manual de Desarrollo es garantizar que cualquier desarrollador o agente de Inteligencia Artificial pueda incorporarse al proyecto, comprender rápidamente la metodología de trabajo y desarrollar nuevas funcionalidades respetando la arquitectura oficial del ERP Lastenia.

Todo el código generado deberá ser coherente, mantenible, escalable y compatible con el resto del sistema.