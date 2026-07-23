# 07_PROJECT_RULES.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Reglas del Proyecto

Reglas de gobierno del repositorio, válidas tanto para integrantes del equipo como para agentes de IA. Complementan — no reemplazan — `docs/02_DEVELOPMENT_GUIDE/05_AI_RULES.md`.

---

## 1. Un único repositorio, un único proyecto por capa

Todo el sistema vive en un repositorio (`ERP-LASTENIA/`), con exactamente un proyecto Laravel (`backend/`) y un proyecto React (`frontend/`). No se crean repositorios adicionales, ni forks funcionales, ni carpetas `backend-v2/`, `frontend-old/`, etc.

## 2. Propiedad de módulo

Cada integrante es responsable de su módulo (`docs/03_MODULE_CONTRACTS/<Modulo>.md`). Modificar un módulo ajeno requiere autorización explícita de su dueño — esto aplica igual a un compañero que a un agente de IA operando en su nombre.

## 3. Prohibido — para cualquiera que escriba código en este repositorio

- Modificar `Shared`, mover carpetas de `01_ARCHITECTURE.md`, o cambiar la arquitectura general sin aprobación del Arquitecto del Proyecto.
- Crear otro Router de frontend o otro punto de entrada (`main.tsx` adicional, otro `index.html`).
- Instalar Redux, Zustand, React Query u otra librería de manejo de estado global sin aprobación.
- Cambiar la configuración de Tailwind, Vite, Laravel o Composer sin aprobación.
- Crear un segundo proyecto React o un segundo proyecto Laravel.
- Crear APIs o rutas fuera de `app/Modules/<Modulo>/Routes/api.php`.
- Modificar módulos ajenos sin autorización de su dueño.
- Eliminar datos históricos de la base de datos (regla de negocio: nunca se borran registros históricos — usar `SoftDeletes` donde aplique).
- Hacer cambios de esquema fuera de una migración versionada y coordinada (`docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md` §2).
- Commitear `.env`, credenciales, `node_modules/`, `vendor/`, `dist/` o `database.sqlite` con datos reales.

## 4. Documentación como fuente de verdad

Toda la documentación en `/docs` es la especificación oficial del proyecto. Ante cualquier contradicción entre el código y `/docs`, prevalece `/docs`. Si el código difiere y crees que la documentación está desactualizada, se corrige la documentación en un PR explícito — no se ignora en silencio.

## 5. Cambios de arquitectura

Toda decisión que afecte a más de un módulo (nueva dependencia global, cambio de convención, nueva librería base) pasa por el Arquitecto del Proyecto y se refleja actualizando el documento correspondiente en `/docs`, no solo el código.

## 6. Versionado de la documentación

Cada documento en `/docs` lleva cabecera de versión (`Versión`, `Última actualización`, `Estado`, `Autor`, `Aprobado por`). Al modificar un documento existente de forma sustantiva, incrementa la versión y actualiza la fecha.

## 7. Excepciones

No hay excepciones a estas reglas sin aprobación explícita del Arquitecto del Proyecto, registrada como comentario en el Pull Request correspondiente.

---

## AI Summary

Si eres un agente de IA operando en este repositorio: estas reglas son tan vinculantes para ti como para cualquier integrante humano del equipo. Ante la duda entre "generar algo que funcione" y "generar algo que respete estas reglas", siempre gana la regla — pregunta antes de romperla.
