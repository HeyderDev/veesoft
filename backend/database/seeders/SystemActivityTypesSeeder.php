<?php

namespace Database\Seeders;

use App\Modules\Planning\Models\Vivero;
use App\Modules\Tasks\Models\ActivityType;
use Illuminate\Database\Seeder;

class SystemActivityTypesSeeder extends Seeder
{
    public function run(): void
    {
        $viveros = Vivero::all();

        foreach ($viveros as $vivero) {
            // Siembra
            ActivityType::firstOrCreate([
                'vivero_id' => $vivero->id,
                'system_code' => 'SEEDING',
            ], [
                'name' => 'Siembra',
                'description' => 'Actividad esencial de Siembra. Relacionada con el inicio del ciclo de producción.',
                'is_system' => true,
                'default_priority' => 'medium',
            ]);

            // Injerto
            ActivityType::firstOrCreate([
                'vivero_id' => $vivero->id,
                'system_code' => 'GRAFTING',
            ], [
                'name' => 'Injerto',
                'description' => 'Actividad esencial de Injerto. Se requiere para el avance de fase en lotes injertados.',
                'is_system' => true,
                'default_priority' => 'high',
            ]);

            // Despacho
            ActivityType::firstOrCreate([
                'vivero_id' => $vivero->id,
                'system_code' => 'DISPATCH',
            ], [
                'name' => 'Despacho',
                'description' => 'Actividad esencial de Despacho. Relacionada con la salida y entrega de plantines.',
                'is_system' => true,
                'default_priority' => 'medium',
            ]);
        }
    }
}
