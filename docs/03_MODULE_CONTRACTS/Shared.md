# 03_MODULE_CONTRACTS/Shared.md

> Versión: 1.1.0 · Última actualización: 2026-07-23 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Shared

**Estado:** Parcialmente implementado (base técnica lista; autenticación real pendiente).
**Ubicación:** `backend/app/Modules/Shared`, `frontend/src/shared` + `frontend/src/layouts` + `frontend/src/components/ui`.
**Responsable:** Compañero de infraestructura / base de datos distribuidas, en coordinación con el Arquitecto.

---

## 1. Responsabilidad

Todo lo reutilizable por cualquier módulo: usuarios, roles, permisos, autenticación, clases base de Controller/Service/Repository, auditoría, notificaciones, configuración global. `Shared` **no** contiene lógica de dominio de ningún módulo funcional.

## 2. Entidades que posee

`User`, `Role`. Pendientes de agregar cuando se implemente autenticación/permisos completos: `Permission`, `AuditLog`, `Notification`, `SystemConfig`.

## 3. Clases base que expone (ya implementadas)

| Clase | Ubicación | Uso |
|---|---|---|
| `BaseApiController` | `Shared/Controllers/BaseApiController.php` | Todo Controller de cualquier módulo extiende esta clase para heredar `successResponse()`, `paginatedResponse()`, `errorResponse()`, `createdResponse()`, `noContentResponse()`. |
| `HealthController` | `Shared/Controllers/HealthController.php` | Expone `GET /api/v1/health`. |
| `BaseService` | `Shared/Services/BaseService.php` | Base opcional para Services con CRUD estándar sobre un Repository. |
| `BaseRepositoryInterface` / `BaseRepository` | `Shared/Repositories/` | Todo Repository de módulo extiende `BaseRepository` e implementa una interfaz que extiende `BaseRepositoryInterface`. |

## 4. Frontend que expone (ya implementado)

- `frontend/src/shared/services/axiosClient.ts` — cliente HTTP único del proyecto. Todo `service` de cualquier módulo lo importa desde aquí.
- `frontend/src/shared/context/AuthContext.tsx` — contexto de sesión (`useAuth()`). Hoy es un stub local; se conecta a la API real cuando `Shared` implemente autenticación.
- `frontend/src/layouts/{AdminLayout,Sidebar,Header,modulesRegistry}.tsx` — shell visual y componente de navegación **compartido** de toda la aplicación. Un módulo nuevo se registra con una sola entrada en `modulesRegistry.tsx` (cambiar `active: false` a `true`), nunca duplica su propio Sidebar/layout. Si el módulo tiene navegación interna tipo drill-down (una lista + secciones dentro de cada elemento, como Planning: Viveros → Resumen/Lotes/Fases), puede declarar opcionalmente `NavProvider`/`SidebarSections` en su entrada del registro — ver `docs/02_DEVELOPMENT_GUIDE/03_FRONTEND_GUIDE.md` §10 y `modules/Planning/hooks/usePlanningNav.tsx` como referencia. Es opcional: un módulo sin ese patrón simplemente omite esos dos campos.
- `frontend/src/components/ui/{Button,Badge,Skeleton,SlideOver,Toast}.tsx` — biblioteca de componentes visuales genéricos. Cualquier módulo los reutiliza; si falta un componente genérico, se agrega aquí, no dentro de un módulo funcional.

## 5. Pendiente de implementar

- Autenticación real (Sanctum ya está instalado en `composer.json` pero no hay login/middleware activo).
- `Permission` y Policies reales por rol — hoy los `FormRequest::authorize()` de Planning devuelven `true` como placeholder.
- Auditoría (`AuditLog`) — quién cambió qué y cuándo, requerido por la regla de negocio "toda modificación queda registrada".

## 6. Dependencias permitidas

`Shared` no depende de ningún módulo funcional. Todos los módulos dependen de `Shared`, nunca al revés.

## 7. Reglas de contribución

Cualquier cambio a `Shared` (nueva clase base, nuevo componente UI genérico, cambio a `AuthContext`) afecta a todos los módulos — coordina con el equipo antes de modificar archivos existentes aquí, no solo antes de agregar nuevos.
