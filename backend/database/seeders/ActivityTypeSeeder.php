<?php

namespace Database\Seeders;

use App\Modules\Tasks\Models\ActivityType;
use App\Modules\Planning\Models\Vivero;
use Illuminate\Database\Seeder;

class ActivityTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $viveros = Vivero::all();

        foreach ($viveros as $vivero) {
            ActivityType::updateOrCreate(
                [
                    'vivero_id' => $vivero->id,
                    'system_code' => 'INJERTO',
                ],
                [
                    'name' => 'Injerto',
                    'description' => 'Actividad de injertación de plantines',
                    'is_system' => true,
                    'default_priority' => 'high',
                ]
            );
        }
    }
}
