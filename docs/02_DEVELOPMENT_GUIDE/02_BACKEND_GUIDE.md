# 02_DEVELOPMENT_GUIDE/02_BACKEND_GUIDE.md

> Versión: 1.1.0 · Última actualización: 2026-07-27 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Guía Oficial de Backend (Laravel)

Todos los ejemplos de este documento están tomados del módulo `Planning`, que es código real que corre en el repositorio (`backend/app/Modules/Planning`). Si tienes dudas sobre cómo aplicar una regla, abre ese archivo.

---

## 1. Arquitectura por capas

```
Route → Controller → Service → Repository → Model → MySQL
                         ↓
                     (Evento) → Synchronization
```

Cada capa tiene una única responsabilidad y **no puede saltarse**. Un Controller nunca llama a un Repository directamente; un Service nunca construye una respuesta HTTP.

---

## 2. Controller

**Responsabilidad:** recibir el `Request`, validar autorización (`Policy`), invocar al `Service` correspondiente y devolver una `Response` con el helper heredado de `BaseApiController`.

**Cuándo usarlo:** en cada endpoint de la API.

**Cuándo NO ponerle código:** nunca contiene condicionales de negocio, cálculos, ni queries. Si estás escribiendo un `if` que decide algo sobre el dominio (por ejemplo, "si hay lotes suficientes"), esa lógica pertenece al Service.

**Ejemplo correcto** (`Planning/Controllers/ProductionCycleController.php`):
```php
public function assignLots(AssignLotsRequest $request, ProductionCycle $productionCycle)
{
    try {
        $assignedLots = $this->planningService->assignLots($productionCycle, $request->input('lots'));
        return $this->successResponse($assignedLots, 'Lotes asignados exitosamente');
    } catch (\Exception $e) {
        return $this->errorResponse($e->getMessage(), 500);
    }
}
```

**Ejemplo incorrecto:**
```php
public function assignLots(Request $request, ProductionCycle $cycle)
{
    // ✘ Validación manual en vez de FormRequest
    // ✘ Lógica de negocio (cálculo de ocupación) dentro del Controller
    foreach ($request->lots as $data) {
        $lot = Lot::find($data['lot_id']);
        $cycle->cycleLots()->create([
            'lot_id' => $lot->id,
            'occupancy_percentage' => $data['assigned_seedlings'] / $lot->total_capacity * 100,
        ]);
    }
}
```

**CRUD simple, mismo patrón:** incluso el CRUD más básico sigue Controller → Service → Repository. Ejemplo real (`Planning/Controllers/ProductionGoalController.php`):
```php
public function store(CreateProductionGoalRequest $request)
{
    $data = $request->validated();
    $data['created_by'] = $request->user()?->id;

    $goal = $this->goalService->create($data);

    return $this->createdResponse($this->goalService->getDetail($goal->id));
}
```
El Service (`ProductionGoalService`) delega en su Repository (`ProductionGoalRepository`) incluso para un `create()` sin lógica adicional — así, el día que aparezca una regla de negocio (por ejemplo, una validación cruzada al crear la meta), tiene un lugar natural donde vivir sin tener que mover el Controller. Ver `Planning/Services/LotService.php` para un caso donde el Service sí añade una regla real (generar un código único de lote cuando no se envía uno).

**Checklist:**
- [ ] ¿El método solo orquesta (Request → Service → Response)?
- [ ] ¿Usa un `FormRequest` en vez de `$request->validate()` inline?
- [ ] ¿Extiende `BaseApiController`?
- [ ] ¿Devuelve siempre `successResponse`/`errorResponse`/`createdResponse`/`noContentResponse`?

---

## 3. Service

**Responsabilidad:** toda la lógica de negocio del módulo. Es la única capa autorizada a comunicarse con Services de otros módulos.

**Cuándo usarlo:** cualquier operación que combine más de una escritura, dispare un evento, o tenga una regla de negocio.

**Cuándo NO usarlo:** un Service no construye respuestas HTTP ni conoce `Request`/`Response`.

**Ejemplo correcto** (`Planning/Services/PlanningService.php`):
```php
public function generateSchedule(ProductionCycle $cycle, array $customDurations = [])
{
    return DB::transaction(function () use ($cycle, $customDurations) {
        $cycleLots = CycleLot::where('production_cycle_id', $cycle->id)->get();

        if ($cycleLots->isEmpty()) {
            throw new \Exception('El ciclo no tiene lotes asignados para planificar.');
        }
        // ... cálculo de fechas por fase ...
        return $generatedPhases;
    });
}
```

Puntos clave de este ejemplo: usa `DB::transaction` porque escribe varias tablas de forma atómica, y lanza una excepción de dominio en vez de devolver `null` silenciosamente — el Controller la traduce a HTTP 500 con `errorResponse()`.

**Comunicación entre módulos:** un Service solo puede invocar métodos públicos de otro Service (inyectado por constructor), nunca su Repository.
```php
// Correcto: Tracking pregunta a Planning
public function __construct(private PlanningService $planningService) {}

public function getLotsInPhase(string $phaseCode)
{
    return $this->planningService->getAvailableLots($phaseCode);
}
```
```php
// Prohibido
use App\Modules\Planning\Repositories\Eloquent\ProductionCycleRepository; // ✘
```

**Checklist:**
- [ ] ¿Contiene toda la lógica de negocio, y el Controller ninguna?
- [ ] ¿Usa `DB::transaction()` cuando escribe más de una tabla?
- [ ] ¿Lanza excepciones de dominio en vez de devolver valores mágicos?
- [ ] ¿Solo llama a Services públicos de otros módulos, nunca a sus Repositories?

---

## 4. Repository

**Responsabilidad:** única capa autorizada a construir queries Eloquent. Implementa una interfaz en `Repositories/Contracts/`.

**Cuándo usarlo:** cuando una consulta se reutiliza en más de un lugar, o cuando quieres poder mockearla en tests sin tocar la base de datos.

**Cuándo NO es obligatorio:** relaciones Eloquent simples (`$model->with(...)->find(...)`) usadas una sola vez dentro de un Controller CRUD básico pueden vivir directamente en el Controller mientras el módulo no tenga Service propio para esa entidad — pero en cuanto haya lógica de negocio, esa entidad pasa a tener su propio Service + Repository.

**Ejemplo correcto** (`Planning/Repositories/Eloquent/ProductionCycleRepository.php`):
```php
class ProductionCycleRepository extends BaseRepository implements ProductionCycleRepositoryInterface
{
    public function __construct(ProductionCycle $model)
    {
        parent::__construct($model);
    }

    public function getCyclesWithDetails()
    {
        return $this->model->with(['plan.goal', 'creator', 'cycleLots.lot', 'dispatches'])->get();
    }
}
```

Todo Repository de módulo extiende `App\Modules\Shared\Repositories\Eloquent\BaseRepository`, que ya da `all()`, `find()`, `create()`, `update()`, `delete()`.

**Checklist:**
- [ ] ¿Implementa una interfaz en `Repositories/Contracts/`?
- [ ] ¿Extiende `BaseRepository` de Shared?
- [ ] ¿Está registrado en `AppServiceProvider::register()`?
- [ ] ¿Ninguna query Eloquent de esta entidad vive fuera de este archivo (una vez que existe)?

---

## 5. Request (FormRequest)

**Responsabilidad:** validar la forma de los datos de entrada. Nada de reglas de negocio (por ejemplo, "el lote debe estar disponible" es una regla de negocio, no de formato, y va en el Service).

**Ejemplo correcto** (`Planning/Requests/AssignLotsRequest.php`):
```php
public function rules(): array
{
    return [
        'lots' => 'required|array|min:1',
        'lots.*.lot_id' => 'required|exists:lots,id',
        'lots.*.assigned_seedlings' => 'required|integer|min:1',
    ];
}
```

**Checklist:**
- [ ] ¿Un `FormRequest` por operación de escritura (`Create...Request`, `Update...Request`)?
- [ ] ¿`authorize()` refleja la Policy real, no siempre `return true`? (Los FormRequests actuales de Planning devuelven `true` porque aún no hay autenticación/roles activos; cuando se active `Shared`, deben delegar a la Policy correspondiente.)

---

## 6. Resource

**Responsabilidad:** transformar Models en JSON consistente para la API. Todavía no se usa en Planning (los controllers devuelven el Model/colección directamente vía `successResponse`); en módulos nuevos, úsalo siempre que la respuesta deba ocultar campos internos o dar forma a datos anidados.

```php
class LotResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'total_capacity' => $this->total_capacity,
            'current_status' => $this->current_status,
        ];
    }
}
```

---

## 7. Policy

**Responsabilidad:** autorización basada en los permisos del rol del usuario autenticado. `Shared` registra en Gate todas las abilities declaradas en `App\Modules\Shared\Enums\PermissionCode`; ningún módulo implementa su propio sistema de permisos.

Las rutas privadas usan primero `auth:sanctum` y después la ability de lectura del módulo. Las operaciones sin `FormRequest`, como `DELETE`, declaran además el permiso de acción en la ruta:

```php
Route::middleware(['auth:sanctum', 'can:planning.view'])->group(function () {
    Route::delete('lots/{lot}', [LotController::class, 'destroy'])
        ->middleware('can:planning.delete');
});
```

Cada `FormRequest` de escritura delega a la misma Policy mediante Gate:

```php
public function authorize(): bool
{
    return $this->user()?->can('planning.create') ?? false;
}
```

Para agregar un permiso:

1. Añade el código al enum `PermissionCode`.
2. Define su etiqueta para que `PermissionSeeder` lo cree con `firstOrCreate`.
3. Asigna el permiso únicamente a los roles que lo necesiten.
4. Protege la ruta y el `FormRequest` con la misma ability.

### Auditoría de Models

Toda entidad que deba conservar historial adopta el trait compartido con una línea dentro de su Model:

```php
use App\Modules\Shared\Traits\Auditable;

class Lot extends Model
{
    use Auditable;
}
```

El trait registra automáticamente creación, actualización y eliminación en `audit_logs`, incluyendo el usuario autenticado y los valores anteriores/nuevos. Los atributos de `$hidden` nunca se copian al JSON de auditoría.

---

## 8. Events / Listeners

**Responsabilidad:** desacoplar Planning (o cualquier módulo) del módulo `Synchronization`. Un módulo nunca llama a `Synchronization` directamente; dispara un evento y `Synchronization` decide si sincroniza.

```php
// En el Service, después de un write exitoso:
event(new LotCreated($lot));
```
```php
// En Planning/Events/LotCreated.php
class LotCreated implements SyncableDomainEvent
{
    use Dispatchable, HasSyncMetadata;

    public function __construct(Lot $lot)
    {
        $this->initializeSyncMetadata(
            'planning.lot',
            $lot->getKey(),
            SyncOperation::CREATED,
        );
    }
}
```

`Synchronization` registra un único listener para la interfaz `SyncableDomainEvent`; el módulo funcional no registra listeners de sincronización ni envía una copia completa del Model. Además, debe registrar un `SyncEntityAdapter` que exporte mediante su Resource/DTO público y aplique entradas mediante su Service público. Este patrón todavía no está adoptado en Planning; se agregará por módulo durante el Paso 3. Ver `docs/03_MODULE_CONTRACTS/Synchronization.md`.

**Checklist:**
- [ ] ¿El evento se nombra en pasado (`LotCreated`, no `CreateLot`)?
- [ ] ¿El módulo que dispara el evento desconoce quién lo escucha?

---

## 9. Jobs

**Responsabilidad:** trabajo diferido (colas). Úsalo para sincronización, envío de notificaciones o cualquier tarea que no deba bloquear la respuesta HTTP.

`Synchronization` implementa `PushSyncQueueJob`. El Job entrega el registro al nodo destino; los intentos, backoff y estados durables viven en `sync_queue`, por lo que un reinicio del worker no pierde el pendiente. `php artisan sync:run` despacha los registros vencidos al worker y `php artisan sync:run --now` los procesa inmediatamente para pruebas/demostraciones. El scheduler ejecuta `sync:run` cada minuto.

---

## 10. DTO

**Responsabilidad:** objeto inmutable para pasar datos entre capas cuando un array asociativo se vuelve difícil de seguir (por ejemplo, el payload de `generateSchedule`). Úsalo cuando un método recibe/devuelve más de 3-4 campos relacionados. Para operaciones simples (CRUD de un Model), pasar el array validado del `FormRequest` directamente es suficiente — no fuerces un DTO donde no aporta claridad.

---

## AI Summary

Si vas a generar código de backend:

✔ Sigue Controller → Service → Repository → Model, sin saltos.
✔ Un `FormRequest` por operación de escritura.
✔ El Repository es la única capa con queries Eloquent (una vez que la entidad tiene Service).
✔ Comunicación entre módulos solo vía Services públicos inyectados por constructor.
✔ Usa `DB::transaction()` para escrituras multi-tabla.
✔ Dispara eventos (`LotCreated`, etc.) en vez de invocar `Synchronization` directamente.
✔ Extiende siempre `BaseApiController`, `BaseService`, `BaseRepository` de `App\Modules\Shared`.

✘ No pongas lógica de negocio en Controllers.
✘ No accedas al Repository de otro módulo.
✘ No hagas `$request->validate()` inline en módulos nuevos: usa `FormRequest`.
✘ No crees una tabla sin migración versionada (ver `04_DATABASE_GUIDE.md`).
