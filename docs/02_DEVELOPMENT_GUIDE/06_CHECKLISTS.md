# 02_DEVELOPMENT_GUIDE/06_CHECKLISTS.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Checklists oficiales del proyecto

Usa la lista correspondiente al momento del flujo en el que estás. No avances a la siguiente etapa (commit, PR, merge) con puntos sin marcar.

---

## 1. Antes de crear un módulo nuevo

- [ ] Leí `docs/03_MODULE_CONTRACTS/<MiModulo>.md` completo.
- [ ] Confirmé con el equipo qué Services de otros módulos voy a consumir.
- [ ] Verifiqué que las carpetas `app/Modules/<MiModulo>` y `src/modules/<MiModulo>` ya existen (creadas en la Fase 1).
- [ ] No voy a crear tablas nuevas sin pasar por el flujo de `04_DATABASE_GUIDE.md` §2.

---

## 2. Antes de hacer commit

- [ ] El código está dentro de `app/Modules/<MiModulo>/` o `src/modules/<MiModulo>/` — no toqué archivos de otro módulo ni de `Shared`/`layouts`/`router` sin autorización.
- [ ] No hay `console.log`, `dd()`, `dump()`, ni comentarios de depuración.
- [ ] Los nombres de archivos, clases, variables y funciones están en inglés; los textos de UI en español.
- [ ] No dupliqué un componente, hook o helper que ya existe en `Shared`/`components/ui`.
- [ ] `npx tsc --noEmit` (si tocaste frontend) no reporta errores nuevos.
- [ ] `php artisan test` (si tocaste backend) sigue en verde.

---

## 3. Antes de abrir un Pull Request

- [ ] La rama sigue la convención de `docs/04_GIT_WORKFLOW.md` (`feature/<modulo>-<descripcion>`).
- [ ] El PR describe qué endpoints/pantallas agrega o modifica.
- [ ] Si agregué una migración, el PR lo menciona explícitamente y fue aprobada según `04_DATABASE_GUIDE.md` §2.
- [ ] Si expuse un método nuevo en mi Service público, actualicé `docs/03_MODULE_CONTRACTS/<MiModulo>.md`.
- [ ] `php artisan route:list --path=api` muestra mis rutas nuevas correctamente.
- [ ] `npm run build` termina sin errores.
- [ ] No incluí archivos generados (`node_modules`, `vendor`, `.env`, `dist/`) en el commit.

---

## 4. Antes de aprobar un merge (revisor)

- [ ] El PR solo toca archivos del módulo declarado (o `Shared`/rutas raíz, si así fue coordinado).
- [ ] Controller → Service → Repository → Model se respeta; no hay lógica de negocio en Controllers ni queries fuera de Repository.
- [ ] El frontend separa Page / ViewModel / Service correctamente.
- [ ] No se accede al Repository de otro módulo ni se importan archivos internos de otro módulo (solo su `index.ts`).
- [ ] Las migraciones nuevas fueron aprobadas por el dueño de la tabla.
- [ ] La documentación de contrato del módulo sigue reflejando la realidad del código.

---

## 5. Antes del despliegue

- [ ] `php artisan migrate --force` corre limpio contra una base de datos igual a producción.
- [ ] `php artisan test` en verde.
- [ ] `npm run build` genera `dist/` sin errores ni warnings críticos.
- [ ] Variables de entorno (`.env`) de producción revisadas — nunca se commitea `.env`, solo `.env.example`.
- [ ] Todos los módulos integrados responden en `GET /api/v1/health`.

---

## AI Summary

Antes de dar por terminada una tarea, recorre la checklist de la etapa en la que estás (commit / PR / merge / despliegue) y no marques nada como listo sin haberlo verificado de verdad (correr el comando, no asumir que pasaría).
