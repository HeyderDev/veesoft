# 09_MASTER_PROMPTS/01_ADAPT_INDIVIDUAL_MODULE.md

> Versión: 1.1.0 · Última actualización: 2026-07-23 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Prompt Maestro — Adaptar tu proyecto individual al estándar del monolito

**Cuándo se usa:** cuando ya clonaste `ERP-LASTENIA` y tienes, en el mismo espacio de trabajo, tu proyecto antiguo (el que construiste solo, con tu propia tecnología) junto al repositorio recién clonado. El objetivo de esta sesión es dejar **tu módulo** funcionando de forma completa y autocontenida dentro de la estructura oficial — todavía no es la integración final con el resto del equipo (eso es el siguiente prompt).

**Cómo usarlo:** completa los 4 placeholders de la sección "Antes de empezar" y pega todo el bloque de "PROMPT" completo a tu asistente de IA (Claude, GPT, Gemini, Antigravity, Cursor, etc.) dentro del repositorio clonado.

---

## Antes de empezar — completa esto

```
[NOMBRE_MODULO]              = (ej: Inventory / Logistics / Tasks / Tracking)
[RUTA_PROYECTO_ANTIGUO]      = (ruta absoluta a tu proyecto anterior en este mismo equipo)
[TECNOLOGIA_ANTERIOR]        = (ej: Vue + Node/Express + PostgreSQL, Django, etc.)
[DESCRIPCION_BREVE_ANTERIOR] = (1-3 líneas: qué hace tu proyecto anterior, qué pantallas/funcionalidades tiene)
```

---

## PROMPT (copia desde aquí)

```
Eres un desarrollador senior incorporándote a ERP Lastenia, un sistema de gestión para el
Vivero de Cacao de la ULEAM (Extensión El Carmen), desarrollado como monolito modular
(un único backend Laravel, un único frontend React) por un equipo de seis estudiantes de
titulación. Cada integrante construyó su módulo por separado y ahora se está integrando
todo bajo una arquitectura y documentación comunes.

═══════════════════════════════════════════════════════════════
TU TAREA EN ESTA SESIÓN (y solo esta)
═══════════════════════════════════════════════════════════════

Adaptar mi módulo, "[NOMBRE_MODULO]", desde mi proyecto anterior (construido en
[TECNOLOGIA_ANTERIOR], ubicado en [RUTA_PROYECTO_ANTIGUO]) hacia la arquitectura y
convenciones oficiales de ERP Lastenia, DENTRO del repositorio ya clonado en el que
estamos trabajando ahora.

Descripción de mi proyecto anterior: [DESCRIPCION_BREVE_ANTERIOR]

Al final de esta sesión, mi módulo debe:
- Vivir en `backend/app/Modules/[NOMBRE_MODULO]/` y `frontend/src/modules/[NOMBRE_MODULO]/`.
- Funcionar de forma completa y autocontenida (migrar, sembrar, correr tests, compilar)
  usando SOLO mi propio módulo — sin depender todavía de que otros compañeros hayan
  terminado el suyo.
- Ser estructuralmente idéntico al módulo `Planning`, que ya está implementado y es la
  referencia oficial del proyecto.

Esta sesión NO incluye: fusionar mi rama con la de mis compañeros, resolver conflictos de
esquema de base de datos entre módulos, ni tocar código de otro módulo. Eso corresponde a
una sesión de integración posterior.

═══════════════════════════════════════════════════════════════
LECTURA OBLIGATORIA ANTES DE ESCRIBIR UNA SOLA LÍNEA DE CÓDIGO
═══════════════════════════════════════════════════════════════

Lee, en este orden, ANTES de tocar código:

1. docs/06_AI_CONTEXT.md               — resumen ejecutivo para IA, léelo primero.
2. docs/00_PROJECT_BRIEF.md            — qué es el proyecto.
3. docs/01_ARCHITECTURE.md             — arquitectura oficial, obligatoria.
4. docs/03_MODULE_CONTRACTS/[NOMBRE_MODULO].md — tu contrato: qué debes construir, qué
   entidades te pertenecen, qué servicios debes exponer, de qué módulos puedes depender.
5. docs/02_DEVELOPMENT_GUIDE/01_MODULE_CREATION.md — el procedimiento paso a paso.
6. docs/02_DEVELOPMENT_GUIDE/02_BACKEND_GUIDE.md    — reglas de Controller/Service/Repository.
7. docs/02_DEVELOPMENT_GUIDE/03_FRONTEND_GUIDE.md   — reglas de Page/ViewModel/Service.
8. docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md   — reglas de migraciones (IMPORTANTE, ver
   sección "Base de datos" de este prompt más abajo).
9. docs/05_CODING_STANDARDS.md, docs/07_PROJECT_RULES.md, docs/08_DEFINITION_OF_DONE.md.

Después de leer la documentación, abre y estudia el código REAL del módulo `Planning`
completo — es el patrón exacto que vas a replicar, no una sugerencia:

Backend:  backend/app/Modules/Planning/  (todas sus subcarpetas)
Frontend: frontend/src/modules/Planning/ (todas sus subcarpetas)

No me preguntes cómo se ve un Repository, un ViewModel o un Service "en teoría" — ábrelos
y cópialos.

═══════════════════════════════════════════════════════════════
REGLA FUNDAMENTAL: PORTAS EL CONOCIMIENTO, NO EL CÓDIGO
═══════════════════════════════════════════════════════════════

Mi proyecto anterior en [RUTA_PROYECTO_ANTIGUO] NO se copia, ni se traduce línea por línea,
ni se reutiliza su arquitectura, sus carpetas, sus nombres de archivo o sus patrones de
diseño. Está en otra tecnología ([TECNOLOGIA_ANTERIOR]) precisamente porque construimos
en paralelo antes de definir el estándar común.

De mi proyecto anterior extraes ÚNICAMENTE:
- Qué entidades del dominio existen (y sus campos/tipos de dato reales).
- Qué relaciones hay entre esas entidades.
- Qué reglas de negocio y validaciones ya resolví (no las repitas mal, ya las pensé).
- Qué pantallas/flujos de usuario existen y qué problema resuelven.
- Qué casos borde o errores ya manejé (mantenlos, no los pierdas al reescribir).

Todo lo demás — la estructura de carpetas, el patrón arquitectónico, cómo se llaman las
clases, cómo se organiza el frontend — se construye desde cero siguiendo exactamente el
patrón de `Planning`, ignorando por completo cómo estaba organizado mi proyecto anterior.

═══════════════════════════════════════════════════════════════
PASO 1 — Extracción y mapeo de dominio (ANTES de escribir código)
═══════════════════════════════════════════════════════════════

Antes de generar ningún archivo, analiza mi proyecto anterior y entrégame estas tres
tablas para que yo las confirme:

1. TABLA DE ENTIDADES
   | Entidad en mi proyecto anterior | Campos principales | ¿Pertenece a [NOMBRE_MODULO]? | Si no, ¿a qué módulo pertenece según docs/03_MODULE_CONTRACTS/? |

2. TABLA DE PANTALLAS/FLUJOS
   | Pantalla o flujo en mi proyecto anterior | Qué hace | Página equivalente que vas a crear |

3. LISTA DE REGLAS DE NEGOCIO DETECTADAS
   (validaciones, cálculos, restricciones de estado, etc. — en lenguaje simple, no código)

NO generes código de backend ni frontend todavía. Espera mi confirmación sobre estas tres
tablas antes de continuar al Paso 2. Si alguna entidad claramente pertenece a otro módulo
(por ejemplo, algo que debería vivir en Shared, o que se superpone con otro módulo del
equipo), señálalo explícitamente en la tabla en vez de asumir que es tuyo.

═══════════════════════════════════════════════════════════════
PASO 2 — Construcción del Backend (después de mi confirmación)
═══════════════════════════════════════════════════════════════

Sigue exactamente el orden y los archivos de referencia de `Planning`:

1. Models — `backend/app/Modules/[NOMBRE_MODULO]/Models/`. Namespace
   `App\Modules\[NOMBRE_MODULO]\Models`. Si necesitas `User`/`Role`, impórtalos desde
   `App\Modules\Shared\Models`. Referencia: `Planning/Models/Lot.php`,
   `Planning/Models/ProductionGoal.php` (fíjate cómo importan `User` desde Shared).

2. Migraciones — una por tabla, en `backend/database/migrations/`, con el mismo formato
   que las de Planning (`$table->id()`, `foreignId()->constrained()->cascadeOnDelete()`,
   `timestamps()`). IMPORTANTE: ver sección "Base de datos" más abajo antes de darlas por
   definitivas.

3. Repositories — interfaz en `Repositories/Contracts/<Entidad>RepositoryInterface.php`
   extendiendo `App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface`,
   implementación en `Repositories/Eloquent/<Entidad>Repository.php` extendiendo
   `App\Modules\Shared\Repositories\Eloquent\BaseRepository`. Referencia exacta:
   `Planning/Repositories/{Contracts,Eloquent}/ProductionGoalRepository*.php` — nota cómo
   cada método de consulta reutilizable (paginar con relaciones, buscar con relaciones)
   tiene su propio método nombrado en la interfaz, no un método genérico parametrizado.

4. Services — `Services/<Entidad>Service.php` extendiendo `App\Modules\Shared\Services\BaseService`,
   inyectando la interfaz específica del Repository (no la genérica) vía constructor
   promovido. Referencia: `Planning/Services/ProductionGoalService.php`. Si tienes lógica
   de negocio real (una regla, un cálculo, algo que combina más de una escritura), síguela
   con el patrón de `Planning/Services/LotService.php` (genera código único) o
   `Planning/Services/PlanningService.php` (transacción multi-modelo con
   `DB::transaction()` y excepciones de dominio).

5. Requests — un `FormRequest` por operación de escritura:
   `Requests/Create<Entidad>Request.php`, `Requests/Update<Entidad>Request.php`. Nunca
   `$request->validate()` inline en el Controller. Referencia:
   `Planning/Requests/CreateProductionGoalRequest.php`.

6. Controllers — `Controllers/<Entidad>Controller.php` extendiendo
   `App\Modules\Shared\Controllers\BaseApiController`. El Controller SOLO orquesta:
   recibe el Request, llama al Service, devuelve la respuesta con
   `successResponse()`/`createdResponse()`/`paginatedResponse()`/`noContentResponse()`/
   `errorResponse()`. Nunca debe llamar a un Model ni a Eloquent directamente. Referencia
   exacta línea por línea: `Planning/Controllers/ProductionGoalController.php`.

7. Rutas — declara tus endpoints en `backend/app/Modules/[NOMBRE_MODULO]/Routes/api.php`
   (mismo formato que `Planning/Routes/api.php`). Luego, en el `backend/routes/api.php`
   raíz, descomenta la línea de tu módulo (ya existe comentada, agregada en la Fase 1).

8. Bindings — agrega el binding de cada interfaz de Repository nueva en
   `backend/app/Providers/AppServiceProvider.php::register()`, siguiendo el bloque
   "---- Módulo Planning ----" ya existente; agrega el tuyo como
   "---- Módulo [NOMBRE_MODULO] ----" justo debajo. (Este archivo es compartido y es
   normal que, al integrar tu rama con la de otro compañero, haya un conflicto de merge
   trivial aquí — cada quien agrega sus propias líneas sin tocar las de los demás.)

═══════════════════════════════════════════════════════════════
PASO 3 — Construcción del Frontend (después del backend)
═══════════════════════════════════════════════════════════════

Sigue exactamente el orden y los archivos de referencia de `Planning`:

1. `frontend/src/modules/[NOMBRE_MODULO]/types/index.ts` — interfaces del dominio,
   tipado fuerte, sin `any`. Referencia: `Planning/types/index.ts`.

2. `frontend/src/modules/[NOMBRE_MODULO]/services/[nombreModulo]Service.ts` — un objeto
   con un método por endpoint, usando `axiosClient` desde
   `../../../shared/services/axiosClient`. Ningún otro archivo del módulo debe importar
   `axiosClient` directamente. Referencia: `Planning/services/planningService.ts`.

3. `frontend/src/modules/[NOMBRE_MODULO]/viewmodels/use<Pantalla>ViewModel.ts` — un hook
   por pantalla, con estado + efectos + handlers, sin JSX. Referencia:
   `Planning/viewmodels/useMetasViewModel.ts`.

4. `frontend/src/modules/[NOMBRE_MODULO]/pages/<Pantalla>Page.tsx` — JSX puro, consume el
   hook, reutiliza `frontend/src/components/ui/{Button,Badge,Skeleton,SlideOver,Toast}.tsx`
   para todo lo genérico. Referencia: `Planning/pages/MetasPage.tsx`.

5. `frontend/src/modules/[NOMBRE_MODULO]/components/` — solo piezas de presentación
   reutilizadas por más de una página DE TU MÓDULO. Si algo es genérico y no depende de tu
   dominio, va en `frontend/src/components/ui/`, no aquí.

6. `frontend/src/modules/[NOMBRE_MODULO]/utils/` — funciones puras sin estado.

7. `frontend/src/modules/[NOMBRE_MODULO]/routes/index.tsx` e
   `frontend/src/modules/[NOMBRE_MODULO]/index.ts` (barrel de exportación pública del
   módulo). Referencia: `Planning/routes/index.tsx`, `Planning/index.ts`.

8. Registro final: en `frontend/src/layouts/modulesRegistry.tsx` (el registro único y
   compartido de módulos que consumen `Sidebar.tsx` y `AdminLayout.tsx`), cambia la entrada
   de tu módulo de `active: false` a `active: true`. Si tu módulo NO tiene una navegación
   interna tipo drill-down (una lista + secciones dentro de cada elemento), no necesitas
   nada más — tu módulo ya aparece como una entrada simple del Sidebar, igual que hoy. Si
   SÍ la tiene (por ejemplo, "elige un almacén y luego navega sus secciones", análogo a
   como Planning navega "elige un vivero y luego Resumen/Lotes/Fases"), agrega también
   `NavProvider`/`SidebarSections` a tu entrada — ver el patrón completo documentado en
   `docs/02_DEVELOPMENT_GUIDE/03_FRONTEND_GUIDE.md` §10, usando
   `modules/Planning/hooks/usePlanningNav.tsx` y
   `modules/Planning/components/PlanningSidebarSections.tsx` como referencia exacta a
   replicar. En `frontend/src/App.tsx`, sigue exactamente el mismo patrón que el
   `case 'planning':` para agregar el `case` de tu módulo (mismo estilo, mismo uso de
   `ToastProvider` si aplica) — esto no cambió.

═══════════════════════════════════════════════════════════════
BASE DE DATOS — LEE ESTO CON CUIDADO
═══════════════════════════════════════════════════════════════

Las migraciones que crees en esta sesión son un BORRADOR DE TRABAJO para que puedas
desarrollar y probar tu módulo localmente — NO son definitivas todavía. Antes de la sesión
de integración (el siguiente prompt maestro), yo voy a:
- Revisar si alguna de tus tablas se superpone con las de otro módulo (especialmente
  usuarios, roles, o cualquier entidad que podría pertenecer a `Shared`).
- Coordinar contigo cualquier cambio de nombre o de propietario de tabla antes de fusionar
  con el resto del equipo.

Por eso: sigue estrictamente el formato de `docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md`
(nombres en snake_case, FKs con `constrained()->cascadeOnDelete()`, nada de `enum` nativo de
MySQL), pero no asumas que el nombre final de cada tabla es intocable — está sujeto a
revisión en la integración.

═══════════════════════════════════════════════════════════════
VERIFICACIÓN OBLIGATORIA ANTES DE DAR ALGO POR TERMINADO
═══════════════════════════════════════════════════════════════

No reportes esta tarea como completa sin correr y confirmar en verde TODOS estos comandos:

  cd backend
  php artisan migrate:fresh --seed
  php artisan test
  php artisan route:list --path=api        (confirma que tus rutas aparecen correctas)
  ./vendor/bin/pint --test app/Modules/[NOMBRE_MODULO]

  cd frontend
  npx tsc --noEmit
  npm run build

Si algo falla, corrígelo antes de continuar. "Debería funcionar" no es lo mismo que
"lo verifiqué".

Escribe además al menos un test (`backend/tests/Feature/`) que ejercite tu módulo de punta
a punta vía HTTP (crear, listar, ver, actualizar, eliminar), siguiendo el patrón de
`backend/tests/Feature/PlanningCrudTest.php`.

═══════════════════════════════════════════════════════════════
PASO 4 — Actualiza la documentación de tu propio contrato
═══════════════════════════════════════════════════════════════

Edita `docs/03_MODULE_CONTRACTS/[NOMBRE_MODULO].md`: reemplaza la sección de "servicios
públicos propuestos" (que era una plantilla inicial) con los métodos reales que
implementaste en tu Service, exactamente como está documentado en
`docs/03_MODULE_CONTRACTS/Planning.md` sección 4. Actualiza también el estado del
documento de "No implementado" a "Implementado", y la cabecera de versión
(incrementa la versión, actualiza la fecha).

═══════════════════════════════════════════════════════════════
PROHIBIDO EN ESTA SESIÓN
═══════════════════════════════════════════════════════════════

- Copiar código o arquitectura de mi proyecto anterior tal cual — solo su conocimiento de
  dominio (ver regla fundamental arriba).
- Modificar cualquier archivo dentro de `app/Modules/` o `src/modules/` que no sea
  `[NOMBRE_MODULO]`.
- Modificar `frontend/src/layouts/`, `frontend/src/router/`, `frontend/src/shared/`, o
  `backend/app/Modules/Shared/` más allá de agregar tus propios bindings en
  `AppServiceProvider` y tu propia línea en `routes/api.php` raíz.
- Instalar Redux, Zustand, React Query, u otra librería de estado/estilo nueva.
- Poner lógica de negocio en un Controller o en un componente React.
- Acceder al Repository de otro módulo — solo a su Service público, y solo si el contrato
  de tu módulo lo permite.
- Dar por definitivo el esquema de base de datos sin pasar por la revisión de integración.

═══════════════════════════════════════════════════════════════
DEFINICIÓN DE "TERMINADO" PARA ESTA SESIÓN
═══════════════════════════════════════════════════════════════

- [ ] Estructura de carpetas idéntica a `Planning` en backend y frontend.
- [ ] Cero lógica de negocio en Controllers, cero llamadas axios fuera de `services/`.
- [ ] Todos los comandos de verificación de la sección anterior pasan en verde.
- [ ] Al menos un test de integración HTTP para tu módulo.
- [ ] `docs/03_MODULE_CONTRACTS/[NOMBRE_MODULO].md` actualizado con la API real.
- [ ] Tu módulo es usable de principio a fin dentro de la aplicación (aparece en el
      Sidebar compartido vía `modulesRegistry.tsx`, navega correctamente, guarda y lee
      datos reales).
- [ ] No toqué ningún archivo fuera de mi módulo salvo los puntos de registro explícitamente
      permitidos arriba.

Cuando termines, dame un resumen de: qué entidades creaste, qué endpoints expuestos, qué
decisiones de diseño tomaste que no estaban 100% claras en mi proyecto anterior, y qué
quedó pendiente o marcado como "a decidir en integración".
```

## PROMPT (termina aquí)

---

## Nota para el Arquitecto (tú)

Cuando un compañero te entregue el resumen final de esta sesión, revisa especialmente:
- La tabla de entidades del Paso 1 (para detectar solapamientos con otros módulos antes de que se conviertan en conflictos de integración).
- Las migraciones nuevas, contra `docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md` §2.
- Que `docs/03_MODULE_CONTRACTS/<Modulo>.md` haya quedado realmente actualizado, no solo el código.
