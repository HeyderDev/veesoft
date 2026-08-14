# 02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Guía Oficial de Base de Datos

---

## 1. Regla de oro

Toda modificación al esquema se hace mediante una migración de Laravel. **Nunca** mediante phpMyAdmin, un `ALTER TABLE` manual, o editando `database.sqlite`/MySQL directamente. Si el esquema real y las migraciones del repositorio no coinciden, las migraciones tienen la razón y hay que corregir la base de datos, no al revés.

---

## 2. Flujo para cambiar el esquema

Ningún integrante crea una migración por su cuenta el mismo día que otro sin coordinarse — así es como aparecen conflictos de merge irresolubles en `database/migrations/`.

```
Necesito una columna/tabla
        ↓
Lo notifico en el canal del equipo (qué tabla, qué campo, por qué)
        ↓
Se aprueba (dueño del módulo dueño de esa tabla + Arquitecto si es tabla de Shared)
        ↓
Creo la migración en mi rama
        ↓
Pull Request
        ↓
Revisión
        ↓
Merge a develop
        ↓
Todos hacen `git pull`
        ↓
`php artisan migrate`
```

**Regla de propiedad:** cada módulo es dueño de sus propias tablas (ver `docs/03_MODULE_CONTRACTS/`). Modificar una tabla de otro módulo requiere aprobación explícita del dueño de ese módulo.

---

## 3. Convención de nombres

| Elemento | Convención | Ejemplo real |
|---|---|---|
| Tabla | `snake_case`, plural | `production_cycles`, `cycle_lots` |
| Columna | `snake_case` | `target_seedlings`, `planned_start_date` |
| Foreign key | `<entidad_singular>_id` | `production_plan_id`, `lot_id` |
| Migración | `YYYY_MM_DD_HHMMSS_create_<tabla>_table.php` | `2026_01_01_000500_create_lots_table.php` |
| Pivote / tabla intermedia | `<entidad1>_<entidad2>` | `cycle_lots`, `climate_event_lots` |

---

## 4. Estructura de una migración

Ejemplo real (`database/migrations/2026_01_01_000700_create_cycle_lots_table.php`):

```php
Schema::create('cycle_lots', function (Blueprint $table) {
    $table->id();
    $table->foreignId('production_cycle_id')->constrained('production_cycles')->cascadeOnDelete();
    $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
    $table->integer('assigned_seedlings');
    $table->decimal('occupancy_percentage', 5, 2)->default(0);
    $table->date('assignment_date');
    $table->string('operational_status', 30)->default('healthy');
    $table->text('observations')->nullable();
    $table->timestamps();
});
```

Reglas que se leen de este ejemplo:
- Toda tabla lleva `$table->id()` como PK autoincremental y `$table->timestamps()`.
- Toda foreign key usa `foreignId(...)->constrained(...)` con `cascadeOnDelete()` (o `nullOnDelete()` si la relación es opcional) — nunca una FK sin `ON DELETE` explícito.
- Campos de estado (`operational_status`, `current_status`) son `string` con `default(...)`, no `enum` de MySQL (los enums de MySQL son costosos de alterar; la validación de valores permitidos vive en el `FormRequest`/`Service`, no en el motor de base de datos).
- Montos porcentuales/decimales usan `decimal(precision, scale)`, nunca `float`.

---

## 5. Claves primarias: autoincremental vs UUID

Planning usa IDs autoincrementales (`$table->id()`) en todas sus tablas, y así debe seguir cualquier módulo que **no** genere registros fuera del Nodo Administrador.

**Excepción a coordinar con el dueño de `Synchronization`:** cualquier tabla cuyos registros puedan crearse en el futuro Nodo Móvil (offline, SQLite) antes de sincronizar con el Nodo Central debe usar `uuid` como clave primaria en vez de autoincremental, porque dos nodos generando IDs autoincrementales en paralelo van a colisionar al fusionar datos. Esta decisión la toma el compañero responsable de `Synchronization` junto con el dueño del módulo — no la tomes unilateralmente en un módulo funcional.

### Alcance UUID aprobado para el Nodo Móvil operativo

La Misión B aprobó migrar, mediante PRs coordinados por dueño:

- `lot_cycles`, `lot_cycle_phases`, `lot_cycle_reschedules`, `climate_events`, `climate_event_lots`, `dispatches`.
- `operational_tasks`, `operational_task_resources`.
- `movements`.
- `tracking_clients`, `tracking_movements`.

No edites las migraciones históricas que crearon estas tablas. Cada conversión debe ser una migración nueva que preserve datos y actualice todas sus FK, Models, firmas de Service, factories, tests y tipos frontend. `audit_logs.auditable_id` debe admitir tanto UUID como BIGINT antes de auditar la primera entidad convertida.

---

## 6. Seeders

Un seeder por entidad de catálogo/base (ver `database/seeders/ProductionPhaseSeeder.php`). Usa siempre `firstOrCreate()`, nunca `create()` a secas, para que el seeder sea idempotente (se pueda correr más de una vez sin duplicar filas):

```php
foreach ($phases as $phase) {
    ProductionPhase::firstOrCreate(['code' => $phase['code']], $phase);
}
```

Registra tu seeder en `DatabaseSeeder::run()` dentro de `$this->call([...])`.

---

## 7. Factories

Una factory por modelo en `database/factories/`, con el mismo nombre base que el modelo (`LotFactory` para `Lot`, sin importar en qué módulo viva el modelo). Esto funciona porque `AppServiceProvider::boot()` registra un resolver de factories por nombre de clase (`Factory::guessFactoryNamesUsing`) — no necesitas configurar nada adicional al crear un modelo nuevo, solo nombra la factory igual que el modelo.

---

## 8. Soft Deletes

Ningún dato histórico se elimina físicamente (regla de negocio: "nunca eliminar registros históricos", ver `proyect_contex.txt`). Cuando una entidad represente algo que un usuario pueda "eliminar" desde la UI (una Meta, un Plan, un Lote), agrega `SoftDeletes`:

```php
Schema::table('lots', function (Blueprint $table) {
    $table->softDeletes();
});
```
```php
class Lot extends Model
{
    use SoftDeletes;
}
```

Las tablas de eventos/histórico puro (`production_histories`, `climate_events`) no necesitan `SoftDeletes` porque nunca se editan ni se borran desde la UI — son append-only.

---

## 9. Índices

Agrega un índice a toda columna usada en un `WHERE`, `ORDER BY` o `JOIN` frecuente que no sea ya una FK (las FK de Laravel ya generan índice automáticamente con `constrained()`):

```php
$table->string('code', 50)->unique(); // ya es único + indexado
$table->index('current_status');      // se filtra seguido por estado
```

---

## AI Summary

Si vas a generar migraciones o modelos:

✔ Toda tabla nueva es una migración versionada, nunca un cambio manual.
✔ Sigue el patrón de `cycle_lots`: `id()`, `foreignId()->constrained()->cascadeOnDelete()`, `timestamps()`.
✔ Nombres de tabla en `snake_case` plural, FKs como `<entidad>_id`.
✔ Seeders con `firstOrCreate()`, nunca `create()`.
✔ No elimines datos históricos; usa `SoftDeletes` en entidades editables desde la UI.
✔ Antes de crear una tabla, confirma con el dueño del módulo (o el Arquitecto si es de `Shared`).

✘ No uses `enum` nativo de MySQL para campos de estado — usa `string` + validación en `FormRequest`.
✘ No cambies una PK a UUID sin coordinar con el dueño de `Synchronization`.
✘ No crees una migración el mismo día que otra persona sin avisar en el canal del equipo.
