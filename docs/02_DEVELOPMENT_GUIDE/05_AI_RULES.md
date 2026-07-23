# 02_DEVELOPMENT_GUIDE/05_AI_RULES.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Reglas para agentes de Inteligencia Artificial

Este documento se dirige directamente a cualquier IA (Claude, GPT, Gemini, Antigravity, Cursor u otra) que genere código para ERP Lastenia. Léelo completo antes de escribir una sola línea.

---

## 1. Fuente de verdad

El orden de prioridad ante cualquier conflicto es:

1. `docs/01_ARCHITECTURE.md`
2. `docs/02_DEVELOPMENT_GUIDE/`
3. `docs/03_MODULE_CONTRACTS/<tu módulo>.md`
4. `docs/07_PROJECT_RULES.md`
5. `docs/05_CODING_STANDARDS.md`
6. Comentarios en el código existente
7. Tu propio criterio

Si el código existente contradice esta documentación, la documentación tiene razón — repórtalo, no lo copies.

---

## 2. Lo que SIEMPRE debes hacer

- Leer `docs/00_PROJECT_BRIEF.md` y `docs/01_ARCHITECTURE.md` antes de generar cualquier estructura.
- Leer `docs/03_MODULE_CONTRACTS/<Modulo>.md` del módulo que vas a tocar antes de escribir código en él.
- Usar la estructura de carpetas ya existente (`app/Modules/<Modulo>/...`, `src/modules/<Modulo>/...`). Nunca inventar una carpeta nueva sin que esté en `01_ARCHITECTURE.md`.
- Seguir Controller → Service → Repository → Model en backend, y Page → ViewModel → Service en frontend.
- Nombrar clases, archivos, variables y funciones en **inglés**. Todo texto visible al usuario en **español**.
- Usar el dominio real del proyecto en los ejemplos y nombres (`ProductionGoalController`, `LotRepository`, `ScheduleService`), nunca genéricos (`UserController`, `ProductRepository`, `OrderService`) salvo que efectivamente pertenezcan al módulo `Shared`.
- Reutilizar `BaseApiController`, `BaseService`, `BaseRepository` de `App\Modules\Shared` en vez de reescribir esa lógica.
- Reutilizar los componentes de `frontend/src/components/ui/` (`Button`, `Badge`, `Skeleton`, `SlideOver`, `Toast`) en vez de crear nuevos equivalentes.
- Mantener tipado fuerte en TypeScript (nada de `any` para entidades del dominio).
- Verificar que el código compile/pase antes de darlo por terminado: `php artisan route:list`, `npx tsc --noEmit`, `npm run build` según lo que hayas tocado.

## 3. Lo que NUNCA debes hacer

- Crear un segundo proyecto Laravel o un segundo proyecto React.
- Crear módulos fuera de `app/Modules/` o `src/modules/`.
- Instalar Redux, Zustand, React Query, styled-components u otra librería de estado/estilo sin que el usuario lo pida explícitamente.
- Cambiar la configuración de Tailwind, Vite o Laravel sin que se pida explícitamente.
- Modificar un módulo del que no es tu responsabilidad sin que el usuario lo indique (por ejemplo, si te piden trabajar en `Inventory`, no toques `Planning` ni `Shared`).
- Acceder al `Repository` de otro módulo. Todo acceso entre módulos es vía `Service` público.
- Poner lógica de negocio dentro de un `Controller` o de un componente React.
- Ejecutar consultas SQL/Eloquent fuera de un `Repository` (una vez que la entidad tiene uno).
- Modificar el esquema de base de datos fuera de una migración versionada.
- Duplicar lógica que ya existe en `Shared` o en un componente/hook reutilizable existente.
- Cambiar convenciones de nombres ya establecidas "porque parecen mejores" — si crees que hay un problema real, señálalo, no lo cambies en silencio.

---

## 4. Al recibir un prompt corto tipo "lee la documentación y respétala"

Eso significa: antes de generar código, lee en este orden — `00_PROJECT_BRIEF.md`, `01_ARCHITECTURE.md`, `03_MODULE_CONTRACTS/<tu módulo>.md`, `02_DEVELOPMENT_GUIDE/01_MODULE_CREATION.md`, y el código real del módulo `Planning` como referencia de estilo. No pidas que te repitan las reglas: ya están aquí.

---

## 5. Cuando algo no está claro

Si el contrato de un módulo no cubre un caso, o si una decisión afecta la arquitectura general (no solo tu módulo), **pregunta antes de improvisar**. No asumas una solución "razonable" que contradiga lo documentado — es preferible una pregunta a un PR que rompe la integración con otro módulo.

---

## AI Summary

✔ Documentación > código existente > tu criterio.
✔ Estructura ya definida en `01_ARCHITECTURE.md`, cópiala; no la reinventes.
✔ Ejemplos y nombres siempre del dominio real del vivero.
✔ Verifica que compile antes de terminar.

✘ Nunca microservicios, Single SPA, segundo proyecto React/Laravel.
✘ Nunca acceso cruzado a Repository de otro módulo.
✘ Nunca lógica de negocio en Controller/componente.
✘ Nunca cambios de esquema fuera de una migración.
