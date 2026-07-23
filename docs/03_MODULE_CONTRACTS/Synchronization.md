# 03_MODULE_CONTRACTS/Synchronization.md

> Versión: 1.0.0 · Última actualización: 2026-07-22 · Estado: Oficial
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

## 5. Dependencias permitidas

`Synchronization` puede escuchar eventos de **todos** los módulos (es la única excepción transversal del sistema), pero solo mediante `Events`/`Listeners` — nunca leyendo el `Repository` de otro módulo directamente.

## 6. Arquitectura de nodos (contexto)

```
Nodo Administrador (React + Laravel + MySQL)
Nodo Móvil (Flutter + SQLite) — futuro
Nodo Central (MySQL)
```

`Synchronization` conecta los tres. Ver `docs/01_ARCHITECTURE.md` sección 14, y la nota sobre claves UUID en `docs/02_DEVELOPMENT_GUIDE/04_DATABASE_GUIDE.md` §5 — cualquier entidad que vaya a poder crearse en el Nodo Móvil necesita coordinar con este módulo su estrategia de clave primaria antes de tener autoincremental en producción.
