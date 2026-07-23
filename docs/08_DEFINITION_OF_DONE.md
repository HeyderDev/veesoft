# 08_DEFINITION_OF_DONE.md

> Versión: 1.1.0 · Última actualización: 2026-07-23 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Definición de "Terminado"

Una tarea, funcionalidad o módulo no se reporta como completo hasta cumplir todo lo siguiente. Esta es la versión corta y verificable de las checklists de `docs/02_DEVELOPMENT_GUIDE/06_CHECKLISTS.md`.

---

## Para una funcionalidad de backend

- [ ] Sigue Controller → Service → Repository → Model, sin lógica de negocio en el Controller.
- [ ] Tiene `FormRequest` para cada operación de escritura.
- [ ] Las rutas están en `Modules/<Modulo>/Routes/api.php` y aparecen en `php artisan route:list --path=api`.
- [ ] `php artisan test` corre en verde (incluye al menos un test para lógica de negocio no trivial, como se hizo con `PlanningServiceTest`).
- [ ] Si escribe en más de una tabla, usa `DB::transaction()`.
- [ ] Si otro módulo necesitará este dato, el método está expuesto en el `Service` público y documentado en `docs/03_MODULE_CONTRACTS/<Modulo>.md`.

## Para una funcionalidad de frontend

- [ ] Separa Page (JSX) / ViewModel (hook) / Service (axios), sin mezclar capas.
- [ ] No usa `any` para tipos del dominio.
- [ ] Reutiliza componentes de `components/ui/` en vez de recrearlos.
- [ ] `npx tsc --noEmit` sin errores.
- [ ] `npm run build` compila sin errores.
- [ ] Maneja estado de carga y de error visible al usuario (no solo `console.error`).

## Para un módulo completo

- [ ] Estructura de carpetas idéntica a `Planning` en backend y frontend.
- [ ] `docs/03_MODULE_CONTRACTS/<Modulo>.md` actualizado con los Services reales expuestos (no solo la propuesta inicial).
- [ ] Registrado en `routes/api.php` raíz (backend) y en `layouts/modulesRegistry.tsx` (frontend, el registro del Sidebar compartido).
- [ ] No accede al `Repository` de otro módulo en ningún punto del código.
- [ ] Migraciones propias, coordinadas y mergeadas sin conflictos.
- [ ] `php artisan migrate:fresh --seed` corre limpio con el módulo integrado.

## Para toda la integración (fin de Fase 2)

- [ ] Todos los módulos activos responden correctamente desde un único `php artisan serve` + `npm run dev`.
- [ ] `GET /api/v1/health` responde `connected`.
- [ ] No quedan referencias a namespaces o rutas antiguas (`App\Models`, `App\Http\Controllers\Api`, `modules/planificacion`, etc.) — verificable con una búsqueda global antes de la entrega.
- [ ] Cada contrato en `docs/03_MODULE_CONTRACTS/` refleja el código real, no la propuesta inicial.
- [ ] `docs/` completa está actualizada a la arquitectura final entregada.

---

## AI Summary

No reportes una tarea como completa por haber escrito el código — repórtala completa solo después de correr los comandos de verificación de esta lista y confirmar que pasan. "Debería funcionar" no es lo mismo que "verifiqué que funciona".
