# 00_PROJECT_BRIEF.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# ERP LASTENIA
## Sistema Integral de Gestión para el Vivero de Cacao Lastenia

**Versión:** 1.0  
**Estado:** Documento Maestro del Proyecto  
**Arquitectura:** Monolito Modular  
**Frontend:** React + Vite + TailwindCSS  
**Backend:** Laravel 12  
**Base de Datos:** MySQL  
**Arquitectura de Datos:** Sistema Distribuido con Sincronización Offline/Online  
**Metodología:** Scrum + GitFlow + Desarrollo Modular

---

# 1. Descripción General

ERP Lastenia es un sistema integral de gestión desarrollado como proyecto de titulación para la Universidad Laica Eloy Alfaro de Manabí (ULEAM), extensión El Carmen.

El sistema tiene como finalidad digitalizar y optimizar los procesos administrativos y operativos del Vivero de Cacao Lastenia, permitiendo reemplazar los procesos manuales actuales por una plataforma moderna, modular y escalable.

El sistema está diseñado para funcionar tanto en entornos de oficina como en trabajo de campo, permitiendo la continuidad operativa incluso cuando no exista conexión a Internet.

---

# 2. Objetivo del Proyecto

Construir un ERP modular capaz de administrar de forma eficiente la producción de plántulas de cacao desde la planificación inicial hasta el despacho final, integrando todos los procesos del vivero bajo una única plataforma.

El sistema busca:

- Reducir tiempos administrativos.
- Eliminar registros manuales.
- Mejorar la trazabilidad.
- Centralizar la información.
- Automatizar cronogramas.
- Facilitar la toma de decisiones.
- Permitir trabajo Offline First.
- Sincronizar automáticamente los diferentes nodos del sistema.

---

# 3. Alcance del Sistema

El sistema contempla la administración completa del vivero mediante módulos especializados.

Los módulos oficiales son:

- Planificación
- Administración de Tareas
- Gestión de Inventario
- Logística de Aprovisionamiento
- Seguimiento de Plántulas
- Infraestructura y Sincronización

Cada módulo posee responsabilidades independientes, pero todos comparten una misma arquitectura, una misma base de datos y un mismo backend.

---

# 4. Filosofía de Desarrollo

Este proyecto NO será desarrollado como múltiples aplicaciones independientes.

Todo el sistema deberá funcionar como un único ERP compuesto por módulos desacoplados.

Cada módulo representa una unidad funcional del sistema, pero todos conviven dentro del mismo proyecto React y del mismo proyecto Laravel.

Se prioriza:

- Bajo acoplamiento.
- Alta cohesión.
- Reutilización de código.
- Escalabilidad.
- Mantenibilidad.
- Legibilidad.
- Modularidad.

---

# 5. Arquitectura General

El sistema utilizará una arquitectura Monolito Modular.

No se utilizarán Microservicios.

No se utilizará Single SPA.

No existirán múltiples proyectos React.

No existirán múltiples proyectos Laravel.

Toda la solución estará organizada mediante módulos internos.

La arquitectura general será:

React
↓
MVVM
↓
API REST Laravel
↓
Services
↓
Repositories
↓
MySQL
↓
Synchronization Module

---

# 6. Arquitectura Tecnológica

## Frontend

- React 19
- Vite
- TailwindCSS
- React Router
- Axios
- Context API
- PWA
- Service Workers

Patrón utilizado:

MVVM

---

## Backend

Laravel 12

Arquitectura por capas:

Controllers

↓

Services

↓

Repositories

↓

Models

El backend será completamente modular.

---

## Base de Datos

Motor:

MySQL

Todas las modificaciones del esquema deberán realizarse mediante migraciones.

No se permiten modificaciones manuales mediante phpMyAdmin.

---

## Sincronización

El sistema implementará una arquitectura de datos distribuida.

Existirán tres tipos de nodos:

Nodo Administrador

React + Laravel + MySQL

↓

Nodo Móvil

Flutter + SQLite

↓

Nodo Central

MySQL

La sincronización será responsabilidad exclusiva del módulo Synchronization.

Ningún otro módulo deberá implementar lógica de sincronización.

---

# 7. Módulos del Sistema

## Planning

Responsable de transformar metas de producción en cronogramas, ciclos y lotes.

---

## Tasks

Administración de actividades operativas.

---

## Inventory

Control de herramientas, insumos y materiales.

---

## Logistics

Gestión de compras y proveedores.

---

## Tracking

Seguimiento del desarrollo de plántulas.

---

## Synchronization

Responsable de la sincronización de los diferentes nodos del sistema.

Este módulo será completamente transversal al resto del ERP.

---

## Shared

Contendrá todos los elementos reutilizables del backend.

Ejemplo:

- Usuarios
- Roles
- Permisos
- Configuración
- Utilidades
- Auditoría
- Autenticación
- Notificaciones

---

# 8. Principios de Ingeniería

Todo el desarrollo deberá seguir los siguientes principios.

## Responsabilidad Única

Cada módulo resuelve únicamente su propio dominio.

---

## Separación de Responsabilidades

Controllers

↓

Services

↓

Repositories

↓

Models

Nunca deberán mezclarse responsabilidades.

---

## Reutilización

Todo código reutilizable deberá ubicarse en Shared.

Nunca deberá duplicarse lógica.

---

## Escalabilidad

Toda decisión técnica deberá considerar el crecimiento futuro del sistema.

---

## Mantenibilidad

El código deberá ser entendible por cualquier desarrollador del equipo.

---

# 9. Convenciones Generales

Todo el proyecto utilizará inglés para:

- carpetas
- archivos
- clases
- métodos
- variables
- rutas internas

Los textos visibles para el usuario estarán en español.

Ejemplo:

PlanningService

createProductionGoal()

LotRepository

Pero la interfaz mostrará:

"Meta de Producción"

"Lote"

"Cronograma"

---

# 10. Flujo General del Sistema

Meta de Producción

↓

Plan de Producción

↓

Cronograma

↓

Lotes

↓

Fases

↓

Administración de Tareas

↓

Inventario

↓

Seguimiento

↓

Despacho

---

# 11. Flujo de Trabajo del Equipo

Todos los integrantes trabajarán sobre un único repositorio.

Cada desarrollador será responsable únicamente de su módulo.

Toda integración deberá realizarse mediante GitFlow.

Cada modificación será desarrollada en una rama propia.

Nunca se desarrollará directamente sobre Main.

---

# 12. Objetivo de la Documentación

Toda la documentación ubicada dentro de la carpeta /docs constituye la especificación oficial del proyecto.

Los desarrolladores deberán seguirla obligatoriamente.

Los agentes de Inteligencia Artificial utilizados durante el desarrollo deberán utilizar esta documentación como única fuente de verdad para comprender la arquitectura del sistema.

Si existe contradicción entre el código generado por una IA y esta documentación, prevalecerá siempre la documentación.

---

# 13. Objetivo Final

Construir un ERP agrícola profesional, modular, mantenible y escalable, capaz de integrarse con aplicaciones móviles y sistemas distribuidos, sirviendo como plataforma tecnológica para la gestión integral del Vivero de Cacao Lastenia y como producto final del proyecto de titulación de la Universidad Laica Eloy Alfaro de Manabí.