# 01_ARCHITECTURE.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# ERP LASTENIA
## Arquitectura Oficial del Proyecto

Versión: 1.0

Estado: Documento Normativo

Este documento define la arquitectura oficial del proyecto.

Toda implementación realizada por desarrolladores o agentes de Inteligencia Artificial deberá respetar estrictamente las reglas aquí descritas.

En caso de contradicción entre el código y este documento, prevalece siempre este documento.

---

# 1. Filosofía Arquitectónica

ERP Lastenia será desarrollado como un **Monolito Modular**.

Esto significa que todo el sistema existirá como:

- Un único proyecto Frontend.
- Un único proyecto Backend.
- Una única Base de Datos.
- Un único repositorio Git.

Los módulos representan dominios funcionales del sistema, no aplicaciones independientes.

Cada módulo deberá poder evolucionar sin afectar el resto del sistema.

---

# 2. Arquitectura General

La arquitectura oficial será:

```

React + Vite + TailwindCSS

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

```

No se utilizarán:

- Microservicios
- Single SPA
- Backend independiente por módulo
- Frontend independiente por módulo

---

# 3. Arquitectura Física

La estructura oficial del repositorio será:

```

ERP-LASTENIA/

docs/

frontend/

backend/

scripts/

docker/

README.md

```

---

## Frontend

```

frontend/

src/

assets/

components/

layouts/

modules/

shared/

router/

hooks/

services/

types/

utils/

```

---

## Backend

```

backend/

app/

Modules/

Shared/

Synchronization/

Providers/

Policies/

Observers/

Events/

Listeners/

Jobs/

database/

routes/

config/

```

---

# 4. Organización de Módulos

Cada módulo deberá existir tanto en Frontend como Backend.

Ejemplo:

```

Planning

Inventory

Logistics

Tasks

Tracking

```

Cada módulo representa un dominio independiente.

---

# 5. Arquitectura Frontend

Cada módulo React deberá seguir exactamente esta estructura.

```

Planning/

components/

pages/

viewmodels/

services/

hooks/

types/

routes/

utils/

index.ts

```

No se permiten carpetas adicionales sin autorización.

---

## Responsabilidad de cada carpeta

components/

Componentes exclusivos del módulo.

pages/

Pantallas completas.

viewmodels/

Toda la lógica de estado.

services/

Comunicación con API.

hooks/

Hooks propios.

types/

Interfaces y tipos.

routes/

Configuración de rutas.

utils/

Funciones auxiliares.

---

# 6. Arquitectura Backend

Cada módulo Laravel deberá seguir exactamente esta estructura.

```

Planning/

Controllers/

Requests/

Services/

Repositories/

Models/

Policies/

Resources/

Routes/

Events/

Listeners/

DTO/

Enums/

Traits/

```

No se permiten estructuras diferentes.

---

# 7. Responsabilidad de cada capa

## Controller

Responsable únicamente de:

- recibir Request
- validar autorización
- llamar Service
- devolver Response

No puede contener lógica de negocio.

---

## Service

Toda la lógica del negocio pertenece aquí.

Puede comunicarse con otros módulos únicamente mediante servicios públicos.

Nunca deberá acceder directamente al Repository de otro módulo.

---

## Repository

Única capa autorizada para acceder a la Base de Datos.

Toda consulta SQL deberá existir únicamente aquí.

---

## Model

Representación del modelo Eloquent.

No deberá contener lógica compleja.

---

## Request

Validación de datos.

No deberá contener reglas de negocio.

---

## Resource

Transformación de respuestas JSON.

---

## Policy

Autorización.

---

## DTO

Objetos de transferencia de datos.

---

# 8. Comunicación entre módulos

Regla obligatoria.

Los módulos NO podrán acceder directamente entre sí.

Incorrecto:

PlanningRepository

↓

InventoryRepository

Correcto:

PlanningService

↓

InventoryService

Todo acceso entre módulos deberá realizarse mediante Services públicos.

---

# 9. Shared Module

El módulo Shared contendrá todo aquello reutilizable por cualquier módulo.

Ejemplo:

Usuarios

Roles

Permisos

Auditoría

Configuraciones

Helpers

Enums Globales

Traits

Notificaciones

Archivos

Logs

Nunca deberá contener lógica específica de un módulo.

---

# 10. Synchronization Module

Synchronization será un módulo transversal.

Su responsabilidad será:

- detectar cambios
- registrar pendientes
- sincronizar nodos
- resolver conflictos
- mantener consistencia

Los demás módulos desconocen cómo funciona la sincronización.

Simplemente trabajan normalmente.

Synchronization observará los cambios mediante eventos.

---

# 11. Eventos del Sistema

Los módulos deberán emitir eventos.

Ejemplo.

Planning crea un lote.

↓

LotCreated

↓

Synchronization escucha

↓

Pendiente de sincronizar

Nunca deberán invocar Synchronization manualmente.

---

# 12. Base de Datos

Existe una única base de datos.

Cada módulo administra únicamente sus tablas.

Está prohibido modificar tablas pertenecientes a otro módulo sin aprobación.

Toda modificación deberá realizarse mediante Migraciones.

Nunca mediante phpMyAdmin.

---

# 13. Dependencias entre módulos

Dependencias permitidas:

Planning

↓

Shared

Inventory

↓

Shared

Tracking

↓

Planning

↓

Shared

Logistics

↓

Inventory

↓

Shared

Synchronization

↓

Todos

Dependencias prohibidas:

Planning

↓

TrackingRepository

Inventory

↓

PlanningRepository

Logistics

↓

TrackingRepository

Los módulos únicamente conocen Services públicos.

---

# 14. Arquitectura Offline

Existirán tres nodos.

Nodo Administrador

React

Laravel

MySQL

↓

Nodo Móvil

Flutter

SQLite

↓

Nodo Central

MySQL

Synchronization conecta los tres nodos.

---

# 15. Flujo General

Usuario

↓

React

↓

ViewModel

↓

Service Frontend

↓

API Laravel

↓

Controller

↓

Service

↓

Repository

↓

MySQL

↓

Evento

↓

Synchronization

---

# 16. Reglas para IA

Toda IA deberá respetar las siguientes reglas.

Nunca:

- Crear otro proyecto React.
- Crear otro proyecto Laravel.
- Crear módulos fuera de Modules.
- Instalar Redux.
- Instalar Zustand.
- Cambiar Tailwind.
- Cambiar Vite.
- Cambiar Laravel.
- Crear carpetas nuevas sin autorización.
- Modificar módulos ajenos.
- Duplicar lógica.
- Crear consultas SQL fuera de Repository.
- Colocar lógica de negocio en Controllers.
- Acceder directamente al Repository de otro módulo.

Siempre deberá:

- Reutilizar código existente.
- Mantener nombres consistentes.
- Utilizar inglés para código.
- Utilizar español para interfaz.
- Seguir MVVM.
- Seguir Repository Pattern.
- Seguir Service Layer.
- Utilizar Migraciones.
- Mantener tipado fuerte.

---

# 17. Escalabilidad

Toda nueva funcionalidad deberá agregarse creando nuevos módulos o ampliando módulos existentes.

Nunca modificando la arquitectura.

---

# 18. Objetivo Arquitectónico

La arquitectura busca:

Alta cohesión.

Bajo acoplamiento.

Escalabilidad.

Mantenibilidad.

Reutilización.

Facilidad de integración.

Compatibilidad con IA.

Código legible.

Separación clara de responsabilidades.

Integración sencilla entre equipos.

El objetivo final es que cualquier desarrollador o agente de Inteligencia Artificial pueda incorporarse al proyecto, leer esta documentación y producir código consistente con el resto del ERP sin necesidad de redefinir la arquitectura.