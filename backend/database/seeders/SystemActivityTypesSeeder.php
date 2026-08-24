<?php

namespace Database\Seeders;

use App\Modules\Planning\Models\Vivero;
use App\Modules\Tasks\Services\ActivityTypeService;
use Illuminate\Database\Seeder;

/**
 * Única fuente registrada para las 3 plantillas de actividad obligatorias del
 * sistema (Siembra/Injerto/Despacho — ver GatedPhaseCatalog). Delega en
 * ActivityTypeService para no duplicar el catálogo entre el seeder y el
 * listener CreateTaskForGatedPhase.
 */
class SystemActivityTypesSeeder extends Seeder
{
    public function run(ActivityTypeService $activityTypeService): void
    {
        Vivero::all()->each(
            fn (Vivero $vivero) => $activityTypeService->seedSystemDefaultsForVivero($vivero->id)
        );
    }
}
