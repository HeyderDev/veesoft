# 09_MASTER_PROMPTS/03_INFRASTRUCTURE_OWNER.md

> Versión: 1.1.0 · Última actualización: 2026-07-27 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Prompt Maestro — Responsable de Infraestructura (Shared → Synchronization)

Este prompt es distinto a `01_ADAPT_INDIVIDUAL_MODULE.md` porque el rol es distinto: no
estás adaptando un módulo funcional de negocio con pantallas CRUD — estás completando la
infraestructura que **todos los demás módulos** dan por hecha (`Shared`), y después
construyendo el módulo de sincronización distribuida (`Synchronization`), que es
propiamente el tema de tu tesis.

Por eso este documento tiene **dos misiones separadas**. No las mezcles en la misma
sesión de IA.

---

## Orden recomendado (coordínalo con el Arquitecto)

```
MISIÓN A (Shared: autenticación, permisos, auditoría)
        ↓
   se integra a develop temprano — antes o en paralelo con que tus
   compañeros adapten sus módulos (Prompt 01), porque varios de ellos
   van a necesitar auth real y Policies reales, no el placeholder
   actual de `authorize() { return true; }`
        ↓
MISIÓN B (Synchronization: cola de sincronización, eventos, nodos)
        ↓
   arranca en serio solo cuando el esquema de base de datos ya está
   mayormente consolidado (después de que varios módulos hayan pasado
   por 02_INTEGRATE_MODULE.md), porque necesitas conocer el esquema
   final para diseñar bien la cola y la resolución de conflictos
```

---

# MISIÓN A — Completar el módulo Shared

## Antes de empezar — completa esto

```
[ESTRATEGIA_AUTH]   = (por defecto: Sanctum SPA con cookies — ya es lo que espera
                        frontend/src/shared/services/axiosClient.ts con `withCredentials: true`.
                        Cámbialo aquí solo si el equipo decidió otra cosa.)
[PROYECTO_AUTH_PREVIO] = (opcional: ruta a un prototipo de autenticación que ya tengas,
                           si aplica la misma regla de "portas el conocimiento, no el código"
                           del Prompt 01)
```

## PROMPT — MISIÓN A (copia desde aquí)

```
Eres un desarrollador senior completando la infraestructura compartida de ERP Lastenia
(monolito modular Laravel + React para el Vivero de Cacao ULEAM). El módulo `Shared` ya
tiene una base técnica parcial: `User`, `Role`, `BaseApiController`, `BaseService`,
`BaseRepository`, `HealthController`. Tu tarea es completarlo con autenticación real,
permisos, y auditoría — la base que TODOS los demás módulos del sistema dan por hecha.

═══════════════════════════════════════════════════════════════
LECTURA OBLIGATORIA
═══════════════════════════════════════════════════════════════

1. docs/06_AI_CONTEXT.md
2. docs/01_ARCHITECTURE.md
3. docs/03_MODULE_CONTRACTS/Shared.md — tu contrato, incluye el estado actual exacto y
   lo que falta (sección 5, "Pendiente de implementar").
4. docs/02_DEVELOPMENT_GUIDE/02_BACKEND_GUIDE.md, sección 7 (Policy).
5. docs/05_CODING_STANDARDS.md, docs/07_PROJECT_RULES.md, docs/08_DEFINITION_OF_DONE.md.

Después, abre y lee el código real ya existente antes de tocar nada:

  backend/app/Modules/Shared/Models/User.php
  backend/app/Modules/Shared/Models/Role.php
  backend/app/Modules/Shared/Controllers/BaseApiController.php
  backend/config/auth.php
  backend/config/sanctum.php
  backend/app/Modules/Planning/Requests/CreateProductionGoalRequest.php   (nota su
    authorize() => true, así están TODOS los FormRequest del sistema hoy — es el
    placeholder que vas a reemplazar por Policies reales)
  frontend/src/shared/context/AuthContext.tsx   (hoy es estado local, no llama a la API)
  frontend/src/shared/services/axiosClient.ts   (ya configurado con withCredentials: true,
    asumiendo autenticación de sesión/cookie tipo Sanctum SPA)

═══════════════════════════════════════════════════════════════
TAREA 1 — Autenticación (Laravel Sanctum, modo [ESTRATEGIA_AUTH])
═══════════════════════════════════════════════════════════════

1. Backend:
   - `Shared/Controllers/AuthController.php`: métodos `login`, `logout`, `me`. Sigue la
     misma forma de respuesta que `BaseApiController` (successResponse/errorResponse).
   - `Shared/Requests/LoginRequest.php`.
   - Middleware: en `backend/bootstrap/app.php`, dentro de `withMiddleware()`, registra
     `EnsureFrontendRequestsAreStateful` para las rutas API (necesario para Sanctum SPA
     con cookies).
   - `backend/config/cors.php`: `supports_credentials` en `true`, y los orígenes del
     frontend (Vite dev server) permitidos.
   - `.env.example`: agrega `SANCTUM_STATEFUL_DOMAINS` con un valor de ejemplo para
     `localhost:5173` (o el puerto real de Vite).
   - Rutas de auth en `Shared/Routes/api.php`: `POST /login`, `POST /logout`,
     `GET /me` (o reutiliza la ruta `/user` ya existente).
   - Protege las rutas de los demás módulos con el middleware `auth:sanctum` en el grupo
     correspondiente — pero ANTES de aplicar esto a rutas ya existentes de otro módulo
     (por ejemplo `Planning/Routes/api.php`), lee la sección "IMPACTO EN OTROS MÓDULOS"
     más abajo.

2. Frontend:
   - `frontend/src/shared/context/AuthContext.tsx`: reemplaza el estado local por
     llamadas reales — `login()` hace `GET /sanctum/csrf-cookie` y luego
     `POST /api/v1/login`; `logout()` llama `POST /api/v1/logout`; al montar la app,
     verifica sesión con `GET /api/v1/me`.
   - Crea una pantalla de login mínima y funcional (no hace falta que sea elaborada) en
     `frontend/src/shared/pages/LoginPage.tsx`. El login no pertenece a ningún módulo de
     negocio (`Planning`, `Inventory`, etc.) — es la puerta de entrada a todo el sistema,
     por eso vive en `shared/`, igual que `AuthContext.tsx`.
   - `shared/` hoy solo tiene `context/` y `services/` — `pages/` es una carpeta nueva.
     `docs/01_ARCHITECTURE.md` exige autorización explícita para carpetas nuevas: esta
     queda pre-autorizada por este prompt, pero documenta en tu Pull Request y al cerrar
     la Misión A que la agregaste y por qué, para que quede registrado igual que cualquier
     otra carpeta nueva del proyecto.
   - No se crea ninguna pantalla de login ni de autenticación dentro de `Synchronization`
     ni de ningún otro módulo — `Synchronization` no tiene componentes visuales propios,
     es un módulo transversal de backend (colas, eventos, jobs).

═══════════════════════════════════════════════════════════════
TAREA 2 — Roles y permisos reales
═══════════════════════════════════════════════════════════════

1. `Shared/Models/Permission.php` + tabla pivote `role_permission` (migración con
   `foreignId()->constrained()->cascadeOnDelete()` en ambos lados, igual que el resto del
   proyecto).
2. Seeder de permisos base (`Shared/...` o `database/seeders/`, sigue el patrón de
   `ProductionPhaseSeeder` con `firstOrCreate`).
3. Policies reales en `Shared/Policies/` (o donde corresponda por convención de Laravel:
   `app/Policies/`, pero regístralas desde `Shared` ya que es infraestructura común) que
   verifiquen permisos del usuario autenticado.

═══════════════════════════════════════════════════════════════
IMPACTO EN OTROS MÓDULOS — LEE CON CUIDADO ANTES DE TOCAR NADA FUERA DE SHARED
═══════════════════════════════════════════════════════════════

Activar autenticación real rompe dos cosas que hoy asumen que no existe auth:

1. **Los FormRequest de otros módulos** (`Planning/Requests/*.php` y los que hayan hecho
   tus compañeros) tienen `authorize() { return true; }` como placeholder. Reemplazarlos
   por una verificación de Policy real es un cambio de UNA línea por archivo, pero está
   fuera de tu módulo — está explícitamente autorizado que tú lo hagas (a diferencia de
   la regla general de "no toques otro módulo"), PERO:
   - Solo tocas el método `authorize()`, nunca `rules()` ni el resto del archivo.
   - Documenta en tu Pull Request, módulo por módulo, qué `authorize()` cambiaste y a qué
     Policy/permiso quedó atado.
   - Si un módulo ya está integrado y tiene tests que llaman a sus endpoints sin
     autenticar, esos tests van a empezar a fallar con 401 — es tu responsabilidad
     actualizarlos (usa `Sanctum::actingAs($user)` de Laravel en los tests), no dejarlos
     rotos ni bajar el nivel de protección para que pasen.

2. **Los tests existentes sin autenticación** (`PlanningCrudTest.php`,
   `PlanningServiceTest.php`) van a fallar en cuanto protejas las rutas de Planning con
   `auth:sanctum`. Antes de aplicar el middleware a las rutas de un módulo ya integrado:
   - Actualiza sus tests para autenticar primero (`Sanctum::actingAs()`).
   - Corre `php artisan test` completo y confirma que sigue en verde.
   - Si vas a proteger rutas de un módulo que todavía no está integrado a `develop`
     (porque su dueño sigue en el Prompt 01), coordina con esa persona antes de tocar sus
     Requests — sus tests locales también se van a romper.

Si esto te parece que afecta a más de un módulo a la vez y no es evidente cómo
coordinarlo sin bloquear a alguien, DETENTE y consúltalo con el Arquitecto antes de
aplicar el middleware globalmente. Es válido activar la protección de forma incremental,
módulo por módulo, en vez de todo de una vez.

═══════════════════════════════════════════════════════════════
TAREA 3 — Auditoría
═══════════════════════════════════════════════════════════════

Regla de negocio del proyecto: toda modificación queda registrada, nunca se eliminan
datos históricos.

1. `Shared/Models/AuditLog.php` + migración (`user_id`, `auditable_type`, `auditable_id`,
   `action`, `changes` en JSON, `timestamps`).
2. Un trait `Shared/Traits/Auditable.php` que cualquier módulo pueda usar en sus Models
   (registra automáticamente create/update/delete vía Eloquent Observers). Documenta en
   `docs/02_DEVELOPMENT_GUIDE/02_BACKEND_GUIDE.md` cómo un módulo nuevo lo adopta (una
   línea: `use Auditable;` en su Model) — esto es una adición a la guía de desarrollo
   existente, no una reescritura.

═══════════════════════════════════════════════════════════════
VERIFICACIÓN OBLIGATORIA
═══════════════════════════════════════════════════════════════

  cd backend
  php artisan migrate:fresh --seed
  php artisan test                          (TODO el sistema, no solo Shared)
  php artisan route:list --path=api
  ./vendor/bin/pint --test app/Modules

  cd frontend
  npx tsc --noEmit
  npm run build

Prueba manual: login real desde el frontend, navega a una pantalla protegida de
`Planning`, confirma que sin sesión te rechaza y con sesión funciona igual que antes.

═══════════════════════════════════════════════════════════════
CIERRE DE LA MISIÓN A
═══════════════════════════════════════════════════════════════

- Actualiza `docs/03_MODULE_CONTRACTS/Shared.md`: mueve de "Pendiente de implementar" a
  "Clases base que expone" todo lo que completaste, con ejemplos reales.
- Actualiza `docs/02_DEVELOPMENT_GUIDE/02_BACKEND_GUIDE.md` sección 7 (Policy) con el
  patrón real ya implementado, reemplazando la nota de "se activa cuando Shared tenga
  autenticación real".
- Resumen final: qué quedó protegido con auth, qué módulos/tests tuviste que tocar y por
  qué, qué decisiones de permisos tomaste que el equipo debería conocer.
```

## PROMPT — MISIÓN A (termina aquí)

---

# MISIÓN B — Construir Synchronization

**No empieces esta misión hasta que el Arquitecto confirme que el esquema de base de
datos ya está razonablemente consolidado** (varios módulos ya pasaron por
`02_INTEGRATE_MODULE.md`). Diseñar la cola de sincronización contra un esquema que
todavía va a cambiar es trabajo que se repite.

## Antes de empezar — completa esto

```
[RUTA_PROTOTIPO_SYNC] = (ruta a tu prototipo/investigación previa de sincronización
                          distribuida, si existe)
[ESTRATEGIA_CONFLICTOS] = (tu propuesta inicial: last-write-wins / versionado / vector
                            clocks / otra — esto se confirma con el Arquitecto en el
                            Paso 1, no se asume)
```

## PROMPT — MISIÓN B (copia desde aquí)

```
Eres un desarrollador senior construyendo el módulo Synchronization de ERP Lastenia — el
módulo de sincronización entre nodos distribuidos (Nodo Administrador, Nodo Central, y en
el futuro Nodo Móvil), correspondiente a la tesis de bases de datos distribuidas del
equipo.

═══════════════════════════════════════════════════════════════
LECTURA OBLIGATORIA
═══════════════════════════════════════════════════════════════

1. docs/06_AI_CONTEXT.md, docs/01_ARCHITECTURE.md (secciones 10, 11, 14).
2. docs/03_MODULE_CONTRACTS/Synchronization.md — tu contrato completo, incluye el
   principio de diseño obligatorio (eventos, no interceptación) y el diagrama exacto del
   flujo esperado. NO te desvíes de ese principio: ningún módulo debe llamar a
   Synchronization directamente, ni Synchronization debe interceptar peticiones antes de
   que se guarden.
3. docs/02_DEVELOPMENT_GUIDE/02_BACKEND_GUIDE.md sección 8 (Events/Listeners) y sección 9
   (Jobs).
4. docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md sección 5 (autoincremental vs UUID) —
   es la decisión de diseño más importante de esta misión y afecta potencialmente a TODOS
   los módulos ya construidos.
5. Revisa el estado real actual del esquema:

     ls backend/database/migrations/
     cat docs/03_MODULE_CONTRACTS/*.md | grep -A5 "Entidades que posee"

═══════════════════════════════════════════════════════════════
REGLA FUNDAMENTAL (igual que en el resto del equipo): PORTAS EL CONOCIMIENTO, NO EL CÓDIGO
═══════════════════════════════════════════════════════════════

Si [RUTA_PROTOTIPO_SYNC] existe, de ahí extraes tu estrategia de resolución de
conflictos, tu diseño de cola, y cualquier problema que ya hayas resuelto en tu
investigación — pero la implementación dentro del monolito sigue exactamente la
estructura de carpetas y el patrón de capas ya usado en el resto del proyecto (Controller
→ Service → Repository → Model, ver `Planning` como referencia de forma, aunque el
contenido de Synchronization sea muy distinto al de un módulo CRUD normal).

═══════════════════════════════════════════════════════════════
PASO 1 — Decisiones de diseño que requieren aprobación del Arquitecto ANTES de codificar
═══════════════════════════════════════════════════════════════

Preséntame, para mi aprobación, ANTES de escribir código:

1. Estrategia de resolución de conflictos que vas a implementar (mi propuesta de partida
   es [ESTRATEGIA_CONFLICTOS], pero justifica si prefieres otra).
2. Esquema de la tabla/cola de sincronización (`sync_queue` o el nombre que propongas):
   columnas, estados posibles, índices.
3. Lista de tablas del sistema (de TODOS los módulos ya integrados) que, según la nota de
   `04_DATABASE_GUIDE.md` §5, deberían migrar de autoincremental a UUID porque sus
   registros podrán crearse en el futuro Nodo Móvil antes de sincronizar. Esto es
   potencialmente el cambio de mayor impacto de toda la Fase 2 — si una tabla ya
   integrada necesita cambiar su tipo de clave primaria, eso afecta a todas sus foreign
   keys en otros módulos. NO lo implementes sin mi aprobación explícita, y sin coordinar
   con cada dueño de módulo afectado.
4. Cómo vas a identificar el nodo de origen de cada registro (columna `origin_node_id` o
   similar) y cómo se van a registrar los nodos conocidos del sistema.

═══════════════════════════════════════════════════════════════
PASO 2 — Construcción (después de mi aprobación del Paso 1)
═══════════════════════════════════════════════════════════════

Sigue la estructura ya creada en `backend/app/Modules/Synchronization/` (vacía desde la
Fase 1, lista para implementar):

1. Models/Migrations: la cola de sincronización y el registro de nodos.
2. Events base / contrato para que otros módulos disparen eventos de forma consistente —
   define en la documentación (no en código de otro módulo) cómo un módulo nuevo declara
   un evento sincronizable, y qué debe implementar ese evento (qué datos mínimos lleva).
3. Listeners que escuchan esos eventos y encolan.
4. Jobs (`Jobs/`) que efectivamente empujan los cambios pendientes hacia el Nodo Central,
   con reintentos.
5. Comando Artisan o endpoint para forzar una sincronización manual (útil para pruebas y
   para la demo de tesis).

═══════════════════════════════════════════════════════════════
PASO 3 — Adopción por otros módulos (coordinado, no unilateral)
═══════════════════════════════════════════════════════════════

Ya construido tu módulo, los módulos existentes (Planning y los que ya estén integrados)
necesitan empezar a disparar eventos reales (`LotCreated`, etc.) en sus Services. Esto
significa tocar código de otros módulos.

- Prepara un PR pequeño y aislado POR MÓDULO (no uno solo que toque todo el sistema),
  agregando únicamente la línea `event(new XCreated($x));` al final del método
  correspondiente en el Service de ese módulo — nunca cambies la lógica de negocio
  existente al hacerlo.
- Notifica al dueño de cada módulo antes de abrir ese PR.
- Corre el test suite completo de ese módulo después de agregar el evento, para
  confirmar que no cambiaste su comportamiento (los eventos no deben alterar el valor de
  retorno del método).

═══════════════════════════════════════════════════════════════
VERIFICACIÓN OBLIGATORIA
═══════════════════════════════════════════════════════════════

  cd backend
  php artisan migrate:fresh --seed
  php artisan test
  ./vendor/bin/pint --test app/Modules/Synchronization

Escribe tests específicos para: que un evento de dominio efectivamente encola un registro
pendiente, y que el Job de sincronización marca correctamente el estado tras un envío
exitoso/fallido (puedes mockear el Nodo Central si aún no existe físicamente).

═══════════════════════════════════════════════════════════════
PROHIBIDO
═══════════════════════════════════════════════════════════════

- Que cualquier módulo llame a `Synchronization` directamente en vez de disparar un
  evento (viola el principio de diseño documentado).
- Cambiar el tipo de clave primaria de una tabla ya integrada sin aprobación explícita y
  sin coordinar con el dueño de ese módulo.
- Modificar la lógica de negocio de otro módulo al agregar el `event()` — solo agregas la
  línea, no tocas nada más.

═══════════════════════════════════════════════════════════════
CIERRE DE LA MISIÓN B
═══════════════════════════════════════════════════════════════

- `docs/03_MODULE_CONTRACTS/Synchronization.md`: estado a "Implementado", con la
  estrategia de conflictos y el esquema real documentados.
- Resumen final: qué tablas quedaron pendientes de migrar a UUID (si alguna) y por qué,
  qué módulos ya disparan eventos y cuáles faltan, y cómo se prueba la sincronización de
  punta a punta para la defensa de tesis.
```

## PROMPT — MISIÓN B (termina aquí)

---

## Nota para el Arquitecto (tú)

- La Misión A es la de mayor impacto inmediato en el resto del equipo — coordina bien el
  momento en que se activa `auth:sanctum` sobre rutas ya integradas, para no bloquear a
  nadie a mitad de su propia sesión de integración.
- La Misión B tiene una decisión (autoincremental vs. UUID) que puede obligar a retrabajo
  en módulos ya cerrados. Revísala tú personalmente en el Paso 1 antes de aprobar —no
  dejes que se decida solo entre la IA y el compañero de infraestructura.
- Considera si la Misión B necesita su propia sesión de "adaptar proyecto individual"
  (como el Prompt 01) antes de este prompt, si el compañero de base de datos distribuidas
  tiene un prototipo previo sustancial — en ese caso, puedes prestarle la lógica del
  Prompt 01 (regla de "portar conocimiento, no código") como complemento antes de este.
