# 04_GIT_WORKFLOW.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Flujo de Trabajo Git (GitFlow simplificado)

---

## 1. Ramas

```
main        → producción / entrega final. Nunca se commitea directo.
develop     → integración. Todas las features se mergean aquí primero.
feature/*   → una rama por tarea, creada desde develop.
```

Nadie desarrolla directamente sobre `main` ni sobre `develop`. Toda modificación pasa por una `feature/*` y un Pull Request.

## 2. Nombres de rama

```
feature/<modulo>-<descripcion-corta>
```

Ejemplos: `feature/planning-generate-schedule`, `feature/inventory-stock-model`, `feature/shared-auth-sanctum`.

Para arreglos de bugs: `fix/<modulo>-<descripcion-corta>`. Para trabajo exclusivo de documentación: `docs/<descripcion-corta>`.

## 3. Commits

Mensaje corto en imperativo, describiendo el qué, no el cómo:

```
feat(planning): agregar cálculo de cronograma por lote
fix(planning): corregir ocupación al asignar lotes
docs(contracts): actualizar contrato de Tasks tras migrar OperationalTask
```

Prefijo recomendado (no obligatorio, pero mantenlo consistente dentro de tu propio historial): `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. El nombre del módulo entre paréntesis ayuda a filtrar el historial cuando el repo tenga varios módulos activos a la vez.

## 4. Pull Request

1. Push de tu rama `feature/*`.
2. Abre PR contra `develop` (nunca contra `main`).
3. Completa la checklist de `docs/02_DEVELOPMENT_GUIDE/06_CHECKLISTS.md` §3 antes de pedir revisión.
4. Un compañero (idealmente el dueño de un módulo con el que tu PR se relacione, o el Arquitecto si toca `Shared`/rutas raíz) revisa antes del merge.
5. Merge a `develop` solo después de aprobación — no hay auto-merge.

## 5. Migraciones y conflictos

Las migraciones de base de datos son la fuente más común de conflictos de merge en un equipo de seis. Sigue siempre el flujo de `docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md` §2 antes de crear una migración — coordinación primero, código después.

## 6. Integración a main

`develop` se mergea a `main` en los hitos de entrega (fin de fase de integración, entrega final), no en cada PR individual. Esa decisión la coordina el Arquitecto con el equipo completo.

## 7. Reglas duras

- Nunca `git push --force` sobre `develop` o `main`.
- Nunca `git commit --no-verify` para saltarse hooks si el proyecto los tiene configurados.
- Nunca commitear `.env`, `node_modules/`, `vendor/`, `dist/` — deben estar en `.gitignore` desde el primer commit.
- Nunca resolver un conflicto de merge borrando el código de un compañero sin entender qué hacía — pregunta antes de descartar.

---

## AI Summary

✔ Toda tarea nace de una rama `feature/<modulo>-<descripcion>` desde `develop`.
✔ PR contra `develop`, revisión antes de merge.
✔ Migraciones: coordinar antes de crear, nunca en paralelo sin avisar.

✘ Nunca commits directos a `main`/`develop`.
✘ Nunca force-push sobre ramas compartidas.
✘ Nunca archivos generados o secretos en el commit.
