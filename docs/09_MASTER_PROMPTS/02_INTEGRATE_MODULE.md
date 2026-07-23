# 09_MASTER_PROMPTS/02_INTEGRATE_MODULE.md

> Versión: 1.1.0 · Última actualización: 2026-07-23 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Prompt Maestro — Integrar un módulo ya adaptado al proyecto principal

**Cuándo se usa:** después de que un módulo completó y verificó el Prompt Maestro
`01_ADAPT_INDIVIDUAL_MODULE.md` (estructura correcta, tests en verde, `docs/03_MODULE_CONTRACTS/<Modulo>.md`
actualizado). Esta sesión fusiona ese trabajo con la rama `develop`, que ya contiene
`Shared`, `Planning`, y cualquier otro módulo integrado previamente.

**Regla de secuencia — muy importante:** los módulos se integran **uno por uno**, nunca
en paralelo sobre el mismo checkout. Si dos módulos se están integrando el mismo día,
coordinen el orden antes de empezar — dos sesiones de este prompt corriendo a la vez
sobre la misma rama van a pisarse.

**Requisito previo:** `develop` debe estar actualizado y en verde (todos los tests
pasando) antes de empezar. Si no lo está, detente y arréglalo primero — no integres
sobre una base rota.

**Cómo usarlo:** completa el placeholder `[NOMBRE_MODULO]` y pega el bloque de "PROMPT"
completo a tu asistente de IA, ejecutándolo desde tu rama de trabajo (la que ya contiene
tu módulo adaptado) con `develop` ya fusionado/rebaseado en ella.

---

## Antes de empezar — completa esto

```
[NOMBRE_MODULO] = (el módulo que se está integrando en esta sesión)
```

---

## PROMPT (copia desde aquí)

```
Eres un desarrollador senior haciendo la integración final del módulo "[NOMBRE_MODULO]"
al monolito ERP Lastenia. El módulo ya fue adaptado a la arquitectura oficial en una
sesión previa (Prompt Maestro 01) y ya pasa sus propias verificaciones de forma aislada.
Tu trabajo ahora es fusionarlo de forma segura con el resto del sistema, que ya incluye
`Shared`, `Planning`, y posiblemente otros módulos integrados antes que el tuyo.

═══════════════════════════════════════════════════════════════
LECTURA OBLIGATORIA ANTES DE EMPEZAR
═══════════════════════════════════════════════════════════════

1. docs/06_AI_CONTEXT.md
2. docs/01_ARCHITECTURE.md (especialmente §13 "Dependencias entre módulos")
3. docs/03_MODULE_CONTRACTS/[NOMBRE_MODULO].md — tu contrato actualizado en la sesión
   anterior.
4. docs/03_MODULE_CONTRACTS/Shared.md y docs/03_MODULE_CONTRACTS/Planning.md — necesitas
   saber exactamente qué exponen ya para no duplicar ni pisar nada.
5. docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md §2 (flujo de aprobación de migraciones).
6. docs/04_GIT_WORKFLOW.md.
7. docs/08_DEFINITION_OF_DONE.md, sección "Para toda la integración (fin de Fase 2)".

Antes de tocar nada, ejecuta un inventario del estado actual de `develop`:

  git log --oneline -10
  ls backend/app/Modules/
  ls frontend/src/modules/
  cat docs/00_PROJECT_BRIEF.md | grep -A10 "Módulos oficiales"

Confírmame qué módulos ya están integrados en `develop` antes de continuar, para que
ambos tengamos el mismo punto de partida.

═══════════════════════════════════════════════════════════════
PASO 1 — Sincronizar tu rama con develop
═══════════════════════════════════════════════════════════════

  git fetch origin
  git merge origin/develop

Esto va a generar conflictos de Git ÚNICAMENTE en archivos compartidos que varios
módulos tocan al registrarse. Resuélvelos así, nunca de otra forma:

- `backend/app/Providers/AppServiceProvider.php`: cada módulo tiene su propio bloque
  `// ---- Módulo <Nombre> ----` con sus bindings. CONSERVA todos los bloques de todos
  los módulos (el tuyo y los que ya estaban), nunca borres el binding de otro módulo.

- `backend/routes/api.php`: cada módulo descomenta su propia línea
  `Route::group([], base_path('app/Modules/<Modulo>/Routes/api.php'));`. CONSERVA las
  líneas ya descomentadas de otros módulos, solo asegúrate de que la tuya también lo esté.

- `frontend/src/layouts/modulesRegistry.tsx`: cada módulo cambia su propia entrada de
  `active: false` a `active: true` en el array `modulesRegistry` (y, si tu módulo tiene
  navegación interna tipo drill-down, agrega ahí mismo tus propios `NavProvider`/
  `SidebarSections` — ver `docs/02_DEVELOPMENT_GUIDE/03_FRONTEND_GUIDE.md` §10). CONSERVA
  el `active: true` y los campos de los módulos ya integrados, cambia/agrega únicamente
  los tuyos. `frontend/src/layouts/Sidebar.tsx` y `AdminLayout.tsx` en sí mismos NO se
  tocan — son el componente compartido, ya leen de este registro automáticamente.

- `frontend/src/App.tsx`: cada módulo agrega su propio `case '<modulo>':` dentro de
  `renderCurrentModule()`. CONSERVA los `case` de otros módulos ya integrados, agrega el
  tuyo siguiendo exactamente el mismo patrón que el de `case 'planning':`.

Si aparece un conflicto de Git en CUALQUIER otro archivo que no sea uno de estos cuatro,
DETENTE y muéstramelo — no lo resuelvas por tu cuenta, puede significar que dos módulos
modificaron el mismo archivo indebidamente.

═══════════════════════════════════════════════════════════════
PASO 2 — Reconciliación de esquema de base de datos
═══════════════════════════════════════════════════════════════

Con `develop` ya fusionado, compara TODAS las migraciones existentes en
`backend/database/migrations/` (las de todos los módulos ya integrados + las tuyas) y
responde, en una tabla, para cada tabla que tu módulo introduce:

| Tabla que introduces | ¿Existe ya una tabla equivalente de otro módulo (mismo propósito, nombre distinto)? | Acción |

Casos a resolver:

1. **Duplicaste `users`/`roles` o cualquier tabla que ya pertenece a `Shared`.**
   Elimina tu migración y tu Model duplicados. Repunta cualquier relación en tu código
   hacia `App\Modules\Shared\Models\User` / `Role`, tal como lo hace
   `Planning/Models/ProductionGoal.php`.

2. **Tu módulo depende de una tabla que hoy vive "prestada" dentro de `Planning`,
   según `docs/03_MODULE_CONTRACTS/Planning.md` §3** (esto aplica específicamente si
   estás integrando `Tasks` — tabla `operational_tasks` — o `Tracking` — tablas
   `climate_events`, `climate_event_lots`, `alerts`, `production_histories`):

   a. Mueve el Model (y su migración, si aplica renombrar algo — normalmente NO hace
      falta recrear la tabla, solo cambiar el namespace del Model) desde
      `backend/app/Modules/Planning/Models/` hacia
      `backend/app/Modules/[NOMBRE_MODULO]/Models/`.
   b. Actualiza el namespace del Model y de su factory en
      `backend/database/factories/`.
   c. Busca TODAS las referencias a ese Model dentro de `Planning` (relaciones Eloquent
      como `CycleLotPhase::operationalTasks()`, `CycleLot::alerts()`,
      `ProductionCycle::histories()`, `User::operationalTasks()`,
      `User::approvedReschedules()`) y decide, junto conmigo, si esa relación:
      - se reemplaza por una llamada al Service público de tu módulo nuevo, o
      - se mantiene como relación Eloquent directa SOLO si ambos Models siguen en el
        mismo lado de un límite de módulo razonable (en general, NO — prefiere Service).
      NO tomes esta decisión sin mostrarme las referencias encontradas primero.
   d. Actualiza `docs/03_MODULE_CONTRACTS/Planning.md` §3 (quita la entidad de "entidades
      que posee temporalmente") y `docs/03_MODULE_CONTRACTS/[NOMBRE_MODULO].md`
      (mueve la entidad a "entidades que posee", con su servicio público real).
      Ambos documentos deben quedar coherentes con el código después de este paso.

3. **Dos módulos ya integrados definen la misma tabla con propósitos distintos.**
   No lo resuelvas tú — deténte y repórtamelo con ambas definiciones lado a lado.

═══════════════════════════════════════════════════════════════
PASO 3 — Verificación de límites entre módulos
═══════════════════════════════════════════════════════════════

Ejecuta estas búsquedas y repórtame los resultados (deben venir vacíos o justificados):

  grep -rn "Modules\\\\[a-zA-Z]*\\\\Repositories" backend/app/Modules/[NOMBRE_MODULO] \
    | grep -v "Modules\\\\[NOMBRE_MODULO]\\\\Repositories" \
    | grep -v "Modules\\\\Shared\\\\Repositories"

Esto detecta si tu módulo accede al Repository de otro módulo que no sea el tuyo o
Shared — está prohibido (docs/01_ARCHITECTURE.md §8). Si aparece algo, reemplázalo por
una llamada al Service público correspondiente.

Confirma también, contra `docs/03_MODULE_CONTRACTS/[NOMBRE_MODULO].md` §"Dependencias
permitidas", que cualquier Service de otro módulo que uses está autorizado en tu
contrato. Si necesitas depender de un módulo no autorizado, deténte y consúltamelo — es
una decisión de arquitectura, no de implementación.

═══════════════════════════════════════════════════════════════
PASO 4 — Verificación completa del sistema (no solo tu módulo)
═══════════════════════════════════════════════════════════════

Con todo fusionado y reconciliado, corre la verificación completa — ya no solo la de tu
módulo, sino la de TODO el sistema integrado hasta ahora:

  cd backend
  composer dump-autoload
  php artisan migrate:fresh --seed --force
  php artisan test
  php artisan route:list --path=api
  ./vendor/bin/pint --test app/Modules

  cd frontend
  npx tsc --noEmit
  npm run build

Todo debe pasar en verde. Si un test de OTRO módulo (no el tuyo) empieza a fallar
después de tu integración, no lo ignores — significa que tu cambio rompió un supuesto de
otro módulo (típicamente, moviste o renombraste algo que otro módulo esperaba). Investiga
y corrige antes de continuar, o detente y repórtamelo si no es evidente cómo arreglarlo
sin tocar el otro módulo.

Adicionalmente, confirma que no quedan referencias a rutas o namespaces obsoletos en todo
el repositorio:

  grep -rn "App\\\\Models\\\\" backend/app backend/database backend/config backend/tests
  grep -rn "modules/planificacion\|core/api\|core/context\|core/routes" frontend/src

Ambas búsquedas deben venir vacías.

═══════════════════════════════════════════════════════════════
PASO 5 — Prueba manual de humo (smoke test)
═══════════════════════════════════════════════════════════════

Levanta el sistema completo y verifica manualmente:

  cd backend && php artisan serve
  cd frontend && npm run dev

1. `GET http://localhost:8000/api/v1/health` responde `"database": "connected"`.
2. En el navegador, confirma que el Sidebar compartido muestra tanto tu módulo como los
   módulos ya integrados anteriormente (todos con `active: true` deben ser navegables,
   ninguno debe haber quedado roto por tu fusión). Si tu módulo o alguno ya integrado
   declara `SidebarSections`, confirma que ese panel se despliega correctamente bajo su
   entrada y que el contenido principal queda sincronizado con los clics hechos ahí.
3. Navega tu módulo de principio a fin (todas sus pantallas) y confirma que lee/escribe
   datos reales contra la base de datos ya consolidada.
4. Si tu módulo consume un Service de `Planning` o `Shared`, verifica ese flujo
   específicamente (por ejemplo, si `Tracking` consulta la fase actual de un lote vía
   `PlanningService`, pruébalo con datos reales de punta a punta).

═══════════════════════════════════════════════════════════════
PASO 6 — Actualizar documentación de cierre
═══════════════════════════════════════════════════════════════

1. `docs/03_MODULE_CONTRACTS/[NOMBRE_MODULO].md`: estado a "Implementado e integrado",
   incrementa versión y fecha.
2. Si tocaste `docs/03_MODULE_CONTRACTS/Planning.md` en el Paso 2, confirma que su
   cabecera de versión también se incrementó.
3. Marca en `docs/08_DEFINITION_OF_DONE.md` (mentalmente o en un comentario del PR, no
   edites esa lista maestra) cuáles de los puntos de "Para toda la integración" ya se
   cumplen con este módulo integrado.

═══════════════════════════════════════════════════════════════
PROHIBIDO EN ESTA SESIÓN
═══════════════════════════════════════════════════════════════

- Resolver un conflicto de Git borrando el trabajo de otro módulo para "que compile más
  rápido". Si algo no cuadra, se pregunta, no se borra.
- Decidir unilateralmente quién es dueño de una tabla disputada entre dos módulos.
- Continuar la integración si `php artisan test` deja algún test de OTRO módulo en rojo.
- Dejar `docs/03_MODULE_CONTRACTS/` desactualizado respecto al código final.
- Hacer `git push --force` sobre `develop`.

═══════════════════════════════════════════════════════════════
CUÁNDO DETENERTE Y AVISARME (no lo resuelvas solo)
═══════════════════════════════════════════════════════════════

- Dos módulos reclaman la misma entidad/tabla con estructuras incompatibles.
- Un conflicto de Git aparece fuera de los 4 archivos esperados del Paso 1.
- Mover una entidad "prestada" de Planning (Paso 2, caso 2) requeriría cambiar más de lo
  que parece razonable, o rompe una regla de negocio ya probada en
  `PlanningServiceTest`/`PlanningCrudTest`.
- Un test de otro módulo falla y no es obvio por qué tu integración lo afectó.

═══════════════════════════════════════════════════════════════
DEFINICIÓN DE "TERMINADO" PARA ESTA SESIÓN
═══════════════════════════════════════════════════════════════

- [ ] `develop` (con tu rama fusionada) pasa TODOS los tests, no solo los tuyos.
- [ ] `php artisan migrate:fresh --seed` corre limpio con el esquema ya consolidado.
- [ ] Cero referencias a Repository ajeno fuera de tu módulo/Shared.
- [ ] Cero referencias a namespaces/rutas obsoletos en todo el repositorio.
- [ ] Smoke test manual confirma navegación y datos reales para tu módulo y los ya
      integrados.
- [ ] `docs/03_MODULE_CONTRACTS/[NOMBRE_MODULO].md` (y `Planning.md` si aplicó) al día.
- [ ] Listo para abrir el Pull Request contra `develop` siguiendo `docs/04_GIT_WORKFLOW.md`.

Al terminar, dame un resumen de: qué conflictos resolviste y cómo, qué decisiones de
esquema tomaste (o qué dejaste pendiente de mi aprobación), y el estado final de la
verificación completa del sistema.
```

## PROMPT (termina aquí)

---

## Nota para el Arquitecto (tú)

- Define con el equipo, antes de la primera integración, el **orden** en que se van a
  integrar los módulos restantes (recomendado: primero el compañero de Infraestructura
  con `Shared`/autenticación vía `03_INFRASTRUCTURE_OWNER.md`, y solo después
  `Inventory`/`Logistics`/`Tasks`/`Tracking`, porque varios de ellos dependen de
  autenticación real y de que las entidades "prestadas" en `Planning` ya tengan dueño).
- El Paso 2 (reconciliación de esquema) es el punto de mayor riesgo de toda la Fase 2 —
  revisa personalmente la tabla de entidades que la IA te entregue en ese paso antes de
  aprobar el PR, no confíes solo en que los tests pasen (un test puede pasar y aun así
  haber una decisión de propiedad de tabla equivocada).
- Si integras `Tasks` o `Tracking` antes que el otro, el segundo de los dos todavía puede
  encontrar referencias cruzadas a ajustar — es normal, adviértelo con anticipación.
