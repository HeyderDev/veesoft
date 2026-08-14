# 03_MODULE_CONTRACTS/Shared.md

> Versión: 1.2.0 · Última actualización: 2026-07-27 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Shared

**Estado:** Implementado. La infraestructura de autenticación, permisos y auditoría está disponible; la adopción de `auth:sanctum` continúa de forma incremental por módulo.
**Ubicación:** `backend/app/Modules/Shared`, `frontend/src/shared` + `frontend/src/layouts` + `frontend/src/components/ui`.
**Responsable:** Compañero de infraestructura / base de datos distribuidas, en coordinación con el Arquitecto.

---

## 1. Responsabilidad

Todo lo reutilizable por cualquier módulo: usuarios, roles, permisos, autenticación, clases base de Controller/Service/Repository, auditoría, notificaciones y configuración global. `Shared` no contiene lógica de dominio de ningún módulo funcional.

## 2. Entidades que posee

| Entidad | Responsabilidad |
|---|---|
| `User` | Usuario autenticable del ERP. Pertenece a un rol y expone `hasPermission()`. |
| `Role` | Agrupa usuarios y permisos mediante `role_permission`. |
| `Permission` | Capacidad estable identificada por un código como `planning.view`. |
| `AuditLog` | Historial polimórfico de creaciones, actualizaciones y eliminaciones, con usuario actor y cambios JSON. |

`Notification` y `SystemConfig` permanecen como extensiones futuras; no son parte de la Misión A.

## 3. Clases e infraestructura que expone

| Clase | Ubicación | Uso |
|---|---|---|
| `BaseApiController` | `Shared/Controllers/BaseApiController.php` | Respuestas API uniformes mediante `successResponse()`, `paginatedResponse()`, `errorResponse()`, `createdResponse()` y `noContentResponse()`. |
| `HealthController` | `Shared/Controllers/HealthController.php` | Expone `GET /api/v1/health`. |
| `AuthController` | `Shared/Controllers/AuthController.php` | Expone login, logout y consulta de la sesión SPA. |
| `UserController` / `UserService` | `Shared/Controllers`, `Shared/Services` | Lista mínima de usuarios activos para selectores compartidos, sin consultas desde el Controller. |
| `BaseService` | `Shared/Services/BaseService.php` | Base opcional para Services con CRUD estándar. |
| `BaseRepositoryInterface` / `BaseRepository` | `Shared/Repositories/` | Contrato e implementación base para Repositories Eloquent. |
| `PermissionCode` | `Shared/Enums/PermissionCode.php` | Catálogo tipado de permisos base por módulo y acción. |
| `PermissionPolicy` | `Shared/Policies/PermissionPolicy.php` | Resuelve las abilities registradas en Gate contra los permisos del rol. |
| `Auditable` | `Shared/Traits/Auditable.php` | Trait reutilizable que registra automáticamente `created`, `updated` y `deleted`. Excluye atributos ocultos como contraseñas. |

## 4. Autenticación SPA

La estrategia oficial es Laravel Sanctum en modo SPA con cookies de sesión y protección CSRF.

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/v1/login` | Público; requiere `email`, `password` y acepta `remember`. |
| `POST` | `/api/v1/logout` | `auth:sanctum`. |
| `GET` | `/api/v1/me` | `auth:sanctum`; devuelve usuario, rol y códigos de permisos. |
| `GET` | `/api/v1/users` | `auth:sanctum`; lista usuarios activos para selectores. |

El middleware SPA stateful se activa en `backend/bootstrap/app.php`. CORS admite credenciales y `.env.example` declara `SANCTUM_STATEFUL_DOMAINS` para Vite.

## 5. Roles y permisos

Los permisos se almacenan en `permissions` y se asignan mediante `role_permission`. `PermissionSeeder` usa `firstOrCreate` y crea el catálogo base para `Planning`, `Inventory`, `Logistics`, `Tasks`, `Tracking` y administración de permisos.

- `Admin`: acceso total. La Policy reconoce este rol como superadministrador.
- `Operario`: lectura operativa; creación/actualización en Planning, Tasks y Tracking; lectura de Inventory. No recibe permisos de eliminación ni de gestión logística.

Todo permiso nuevo se agrega primero a `PermissionCode` y al seeder de `Shared`; ningún módulo implementa su propio RBAC.

La protección se activa incrementalmente para evitar romper trabajo concurrente:

- `Planning`: protegido con `auth:sanctum`, `planning.view` y permisos por acción. Sus `FormRequest::authorize()` delegan a Gate.
- `Inventory`, `Logistics`, `Tasks`, `Tracking`: catálogo de permisos listo; la activación de middleware y el cambio de sus `authorize()` requieren coordinación con cada dueño y actualización simultánea de sus pruebas.

## 6. Auditoría

`AuditLog` registra:

- `user_id` nullable para procesos del sistema o seeders.
- `auditable_type` y `auditable_id`.
- `action`: `created`, `updated` o `deleted`.
- `changes`: JSON con valores `before`/`after` según corresponda.

Para adoptar auditoría en un Model:

```php
use App\Modules\Shared\Traits\Auditable;

class Lot extends Model
{
    use Auditable;
}
```

Los atributos declarados en `$hidden` no se guardan en el historial.

## 7. Frontend que expone

- `frontend/src/shared/services/axiosClient.ts`: cliente HTTP único con `withCredentials: true`.
- `frontend/src/shared/context/AuthContext.tsx`: inicializa la sesión con `GET /me`, obtiene la cookie CSRF antes del login y expone `login()`/`logout()` asíncronos con tipos reales.
- `frontend/src/shared/pages/LoginPage.tsx`: puerta de entrada común del ERP. La carpeta nueva `shared/pages/` fue autorizada expresamente por el Prompt Maestro de la Misión A porque el login no pertenece a un módulo funcional.
- `frontend/src/layouts/{AdminLayout,Sidebar,Header,modulesRegistry}.tsx`: shell compartido. `Header` muestra el usuario real y permite cerrar sesión.
- `frontend/src/components/ui/`: componentes visuales genéricos.

## 8. Dependencias permitidas

`Shared` no depende de ningún módulo funcional para autenticación, permisos o auditoría. Todos los módulos dependen de `Shared`, nunca al revés.

Las relaciones históricas existentes desde `User` hacia entidades de Planning se conservan por compatibilidad, pero no deben usarse para introducir lógica de dominio dentro de `Shared`.

## 9. Reglas de contribución

Todo cambio a códigos de permiso, respuestas de autenticación, `AuthContext` o al formato de auditoría afecta a varios módulos. Debe coordinarse con el Arquitecto y documentarse en el Pull Request.
