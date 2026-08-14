<?php

namespace App\Modules\Shared\Enums;

enum PermissionCode: string
{
    case SHARED_PERMISSIONS_MANAGE = 'shared.permissions.manage';

    case PLANNING_VIEW = 'planning.view';
    case PLANNING_CREATE = 'planning.create';
    case PLANNING_UPDATE = 'planning.update';
    case PLANNING_DELETE = 'planning.delete';

    case INVENTORY_VIEW = 'inventory.view';
    case INVENTORY_CREATE = 'inventory.create';
    case INVENTORY_UPDATE = 'inventory.update';
    case INVENTORY_DELETE = 'inventory.delete';

    case LOGISTICS_VIEW = 'logistics.view';
    case LOGISTICS_CREATE = 'logistics.create';
    case LOGISTICS_UPDATE = 'logistics.update';
    case LOGISTICS_DELETE = 'logistics.delete';

    case TASKS_VIEW = 'tasks.view';
    case TASKS_CREATE = 'tasks.create';
    case TASKS_UPDATE = 'tasks.update';
    case TASKS_DELETE = 'tasks.delete';

    case TRACKING_VIEW = 'tracking.view';
    case TRACKING_CREATE = 'tracking.create';
    case TRACKING_UPDATE = 'tracking.update';
    case TRACKING_DELETE = 'tracking.delete';

    public function label(): string
    {
        return match ($this) {
            self::SHARED_PERMISSIONS_MANAGE => 'Administrar permisos',
            self::PLANNING_VIEW => 'Ver planificación',
            self::PLANNING_CREATE => 'Crear en planificación',
            self::PLANNING_UPDATE => 'Actualizar planificación',
            self::PLANNING_DELETE => 'Eliminar en planificación',
            self::INVENTORY_VIEW => 'Ver inventario',
            self::INVENTORY_CREATE => 'Crear en inventario',
            self::INVENTORY_UPDATE => 'Actualizar inventario',
            self::INVENTORY_DELETE => 'Eliminar en inventario',
            self::LOGISTICS_VIEW => 'Ver logística',
            self::LOGISTICS_CREATE => 'Crear en logística',
            self::LOGISTICS_UPDATE => 'Actualizar logística',
            self::LOGISTICS_DELETE => 'Eliminar en logística',
            self::TASKS_VIEW => 'Ver tareas',
            self::TASKS_CREATE => 'Crear tareas',
            self::TASKS_UPDATE => 'Actualizar tareas',
            self::TASKS_DELETE => 'Eliminar tareas',
            self::TRACKING_VIEW => 'Ver seguimiento',
            self::TRACKING_CREATE => 'Crear en seguimiento',
            self::TRACKING_UPDATE => 'Actualizar seguimiento',
            self::TRACKING_DELETE => 'Eliminar en seguimiento',
        };
    }
}
