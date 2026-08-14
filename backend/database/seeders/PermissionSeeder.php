<?php

namespace Database\Seeders;

use App\Modules\Shared\Enums\PermissionCode;
use App\Modules\Shared\Models\Permission;
use App\Modules\Shared\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (PermissionCode::cases() as $permissionCode) {
            Permission::firstOrCreate(
                ['code' => $permissionCode->value],
                ['name' => $permissionCode->label()]
            );
        }

        $adminRole = Role::firstOrCreate(
            ['name' => 'Admin'],
            ['description' => 'Administrador del sistema']
        );
        $adminRole->permissions()->syncWithoutDetaching(Permission::query()->pluck('id'));

        $operatorRole = Role::firstOrCreate(
            ['name' => 'Operario'],
            ['description' => 'Operario de campo']
        );
        $operatorPermissions = [
            PermissionCode::PLANNING_VIEW,
            PermissionCode::PLANNING_CREATE,
            PermissionCode::PLANNING_UPDATE,
            PermissionCode::INVENTORY_VIEW,
            PermissionCode::TASKS_VIEW,
            PermissionCode::TASKS_CREATE,
            PermissionCode::TASKS_UPDATE,
            PermissionCode::TRACKING_VIEW,
            PermissionCode::TRACKING_CREATE,
            PermissionCode::TRACKING_UPDATE,
        ];

        $operatorRole->permissions()->syncWithoutDetaching(
            Permission::query()
                ->whereIn('code', array_map(
                    fn (PermissionCode $permission): string => $permission->value,
                    $operatorPermissions
                ))
                ->pluck('id')
        );
    }
}
