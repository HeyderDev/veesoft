# 03_MODULE_CONTRACTS/Synchronization.md

> Versión: 1.2.0 · Última actualización: 2026-07-27 · Estado: Oficial
> Autor: Equipo ERP Lastenia · Aprobado por: Arquitectura del Proyecto

# Contrato del módulo Synchronization

**Estado:** No implementado (esqueleto de carpetas creado, sin código). Este es el módulo del compañero cuya tesis trata sobre bases de datos distribuidas.
**Ubicación:** `backend/app/Modules/Synchronization` (vacío, listo para implementar).

---

## 1. Responsabilidad

Sincronizar los distintos nodos del sistema (Nodo Administrador ↔ Nodo Central, y más adelante Nodo Móvil) manteniendo consistencia eventual de los datos. Es el único módulo con lógica de distribución — ningún otro módulo debe implementar sincronización propia.

## 2. Principio de diseño obligatorio: eventos, no interceptación

**Incorrecto** (no implementar así): que todas las peticiones de todos los módulos pasen primero por `Synchronization` antes de guardar.

**Correcto** (obligatorio):
```
Planning → PlanningService → PlanningRepository → MySQL Local
                                                        ↓
                                                    (Evento: LotCreated)
                                                        ↓
                                            Synchronization escucha
                                                        ↓
                                        Encola como "pendiente de sincronizar"
```

Cada módulo guarda normalmente y dispara un evento de dominio (`LotCreated`, `ProductionGoalUpdated`, etc.) después de escribir. `Synchronization` se suscribe a esos eventos vía `Listeners/`. Ningún módulo invoca a `Synchronization` directamente ni conoce cómo funciona — esto es lo que mantiene el sistema desacoplado.

## 3. Lo que debe construir este módulo

- Tabla de cola de sincronización (`sync_queue` o similar): qué entidad, qué operación, cuándo, estado (`pending`, `synced`, `conflict`).
- `Listeners/` que escuchan los eventos de dominio de los demás módulos y encolan.
- Estrategia de resolución de conflictos (last-write-wins, versión, o la que se decida en la Fase 0 del proyecto).
- Job en cola (`Jobs/`) que efectivamente empuja los cambios pendientes al Nodo Central.

## 4. Lo que los demás módulos deben hacerle llegar

Cada módulo, al implementar una escritura que deba viajar a otros nodos, dispara el evento correspondiente (ver `docs/02_DEVELOPMENT_GUIDE/02_BACKEND_GUIDE.md` §8). Es responsabilidad de cada dueño de módulo definir y disparar sus propios eventos; es responsabilidad de `Synchronization` escucharlos y no perder ninguno.

### Payload mínimo — para no acoplar Synchronization al esquema de cada módulo

El evento de dominio (`LotCreated`, etc.) debe llevar solo lo mínimo indispensable para identificar el cambio: `entity_type`, `entity_id`, `operation`, `occurred_at`, `origin_node_id`. **Nunca** una copia de todos los campos del modelo en ese instante.

Cuando el Job de sincronización necesita el registro completo para empujarlo al Nodo Central, lo pide al **Service público** del módulo dueño (o consume el mismo `Resource` que ese módulo ya expone en su API) — igual que cualquier otra comunicación entre módulos permitida por `docs/01_ARCHITECTURE.md` §8. `Synchronization` nunca conoce de antemano la lista de campos de negocio de otro módulo.

Esto es lo que determina qué tan caro es un cambio de esquema en un módulo funcional:

- Un módulo agrega, renombra o quita un campo que **no** participa en la resolución de conflictos → cero cambios en `Synchronization`. Solo se actualiza el `Resource`/DTO del módulo dueño, que ya es mantenimiento normal de ese módulo.
- Un campo pasa a ser relevante para decidir conflictos (por ejemplo, se necesita para saber cuál versión es "más nueva") → cambio acotado a la lógica de resolución de esa entidad puntual, no una reescritura del módulo.
- Casos que sí obligan a tocar `Synchronization` sin importar el diseño: una entidad completamente nueva que deba sincronizarse (evento + Listener nuevos, aditivo), o el cambio de clave primaria de autoincremental a UUID después de que ya se asumió autoincremental para esa tabla (ver §6).

Por eso el prompt `09_MASTER_PROMPTS/03_INFRASTRUCTURE_OWNER.md` recomienda construir la infraestructura genérica de `Synchronization` (cola, registro de nodos, Job, resolución de conflictos) sin esperar a que los módulos funcionales estén 100% cerrados, pero posponer la conexión de los eventos reales de cada módulo hasta que su esquema esté razonablemente estable.

## 5. Dependencias permitidas

`Synchronization` puede escuchar eventos de **todos** los módulos (es la única excepción transversal del sistema), pero solo mediante `Events`/`Listeners` — nunca leyendo el `Repository` de otro módulo directamente.

## 6. Arquitectura de nodos (contexto)

```
Nodo Administrador (React + Laravel + MySQL)
Nodo Móvil (React empaquetado con Capacitor + SQLite nativo) — futuro
Nodo Central (MySQL)
```

`Synchronization` conecta los tres. Ver `docs/01_ARCHITECTURE.md` sección 14, y la nota sobre claves UUID en `docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md` §5 — cualquier entidad que vaya a poder crearse en el Nodo Móvil necesita coordinar con este módulo su estrategia de clave primaria antes de tener autoincremental en producción.

### Por qué Capacitor + SQLite y no Flutter 100% nativo ni PWA

Se evaluaron tres opciones para el Nodo Móvil:

- **Flutter 100% nativo:** implica reimplementar los 5 módulos funcionales (Planning, Inventory, Logistics, Tasks, Tracking) en un segundo stack (Dart), duplicando lógica de negocio y UI, y rompiendo la filosofía de monolito modular de un único frontend que rige el resto del proyecto (`docs/01_ARCHITECTURE.md` §1). Alto riesgo de no llegar a tiempo con seis integrantes manteniendo dos codebases sincronizadas manualmente.
- **PWA (Service Worker + IndexedDB):** reutiliza el frontend React sin envoltorio nativo, pero IndexedDB no es una base de datos SQLite real, y el soporte de Background Sync API es débil o inexistente en iOS Safari. Para un proyecto de tesis centrado específicamente en bases de datos distribuidas, no tener una base de datos real en el nodo offline debilita la demostración (consistencia eventual, resolución de conflictos, nodos escribiendo en paralelo).
- **Capacitor (WebView) + plugin de SQLite nativo — opción elegida:** empaqueta el mismo build de Vite/React ya usado en el Nodo Administrador como app Android nativa. La UI, los ViewModels y la lógica de negocio de los 5 módulos no se duplican. El plugin de SQLite nativo (ej. `@capacitor-community/sqlite`) provee una base de datos real en el dispositivo, no un cache de navegador, lo que sí sostiene la demostración de un nodo distribuido genuino.

Este módulo (`Synchronization`) es responsable de:
1. Definir el esquema de la base de datos SQLite local del Nodo Móvil (espejo reducido del esquema MySQL relevante, con las tablas ya migradas a UUID según §5 de `04_DATABASE_GUIDE.md`).
2. Definir el patrón de "outbox" local: una tabla en SQLite donde el cliente encola escrituras hechas sin conexión, análoga a `sync_queue` en el backend.
3. Exponer/documentar el mismo contrato de eventos y estados (`pending`/`synced`/`conflict`) para que el outbox del Nodo Móvil y la cola del backend usen el mismo vocabulario de sincronización — no dos mecanismos distintos.

Esta decisión reemplaza la mención anterior de "Flutter" en versiones previas de este documento y de `docs/01_ARCHITECTURE.md` §14 (actualizado 2026-07-27). Sigue pendiente de construir: es responsabilidad de quien implemente Misión B del prompt `09_MASTER_PROMPTS/03_INFRASTRUCTURE_OWNER.md` diseñar el esquema SQLite y el outbox en detalle, con aprobación del Arquitecto antes de codificar (mismo Paso 1 que ya rige la cola del backend).

## 7. Cómo se comunican los nodos entre sí (propuesta a confirmar en el Paso 1 de la Misión B)

Nodo Administrador y Nodo Central corren el **mismo código** (mismo monolito Laravel, sin fork), solo con `.env` y despliegue distintos — consistente con la regla de "un único backend" de `docs/01_ARCHITECTURE.md` §1. Propuesta de transporte, a confirmar con el Arquitecto antes de codificar:

- `Synchronization` expone un endpoint propio, `POST /api/v1/sync/receive`, protegido con un token de nodo (no con sesión de usuario — el emisor es otro nodo, no una persona).
- El Job de sincronización del nodo emisor llama a ese endpoint del nodo receptor con el payload pendiente.
- Se mantiene el mismo patrón cliente→API que ya usa el resto del proyecto, en vez de que el Job escriba directo en la base de datos del otro nodo por una segunda conexión Eloquent (eso rompería la regla de que toda escritura pasa por Service→Repository).
- El futuro outbox del Nodo Móvil (§6) le habla al mismo endpoint — no es un mecanismo de transporte distinto, solo un tercer emisor.

## 8. Estrategia de pruebas sin nodo móvil

Mientras el Nodo Móvil no exista, se puede probar el ciclo completo de sincronización con solo Administrador y Central, corriendo dos instancias locales del mismo backend:

```
Instancia A (.env → puerto 8000, DB "administrador")   ← Nodo Administrador
Instancia B (.env.central → puerto 8001, DB "central")  ← Nodo Central
```

No requiere MySQL real para desarrollo — `backend/.env.example` ya usa SQLite por defecto (`DB_CONNECTION=sqlite`), así que basta con dos archivos `database.sqlite` distintos para las dos instancias; se valida contra MySQL real antes de la entrega/defensa.

Niveles de prueba, de más aislado a más end-to-end:

1. **Test de Listener** (unitario): disparar el evento de dominio y verificar que crea una fila en `sync_queue` en estado `pending`. No requiere segunda instancia.
2. **Test de Job** (`Queue::fake()` / HTTP fake de Laravel): verificar que arma el payload correcto y marca `synced` o `conflict` según una respuesta simulada del Central, sin que el Central esté corriendo de verdad.
3. **Test de integración real**: las dos instancias corriendo, crear un registro en Administrador, disparar la sincronización (comando manual o scheduler), y confirmar en la base del Central que el dato llegó y que `sync_queue` quedó en `synced`.
4. **Prueba de conflicto deliberada**: modificar el mismo registro en ambos nodos antes de sincronizar, y verificar que la estrategia de resolución elegida (§3) actúa como se espera y queda auditada — es la demostración central para la defensa de tesis (consistencia eventual, resolución de conflictos, nodos escribiendo en paralelo).

Cuando exista el Nodo Móvil, el mismo contrato de prueba se extiende: el outbox local de SQLite termina hablándole al mismo endpoint `/api/v1/sync/receive` del Central (§7), no es una arquitectura de pruebas distinta, es la misma con un tercer emisor.
