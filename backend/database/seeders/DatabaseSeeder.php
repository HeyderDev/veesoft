<?php

namespace Database\Seeders;

use App\Modules\Shared\Models\Role;
use App\Modules\Shared\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Crear roles base
        $adminRole = Role::firstOrCreate(['name' => 'Admin'], ['description' => 'Administrador del sistema']);
        $operatorRole = Role::firstOrCreate(['name' => 'Operario'], ['description' => 'Operario de campo']);

        // Crear usuario admin
        User::firstOrCreate(
            ['email' => 'admin@vivero.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'General',
                'password' => Hash::make('password123'),
                'role_id' => $adminRole->id,
                'status' => 'active',
            ]
        );
    }
}
