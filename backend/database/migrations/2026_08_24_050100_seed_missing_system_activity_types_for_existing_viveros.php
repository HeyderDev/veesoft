<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * "Fase 5: fases gateadas" necesita que las 3 actividades de sistema (Siembra,
 * Injerto, Despacho — ver GatedPhaseCatalog) existan en TODO vivero, no solo en
 * los nuevos (ver ActivityTypeService::seedSystemDefaultsForVivero(), que es lo
 * que corre SystemActivityTypesSeeder y el listener CreateTaskForGatedPhase).
 * Mismo patrón que 2026_08_24_040000_seed_missing_production_phases_for_existing_viveros.php:
 * migración de datos con array embebido (no depende de código de la app que
 * pueda cambiar), inserta solo lo que falte.
 */
return new class extends Migration
{
    private const SYSTEM_ACTIVITY_TYPES = [
        ['system_code' => 'SEEDING', 'name' => 'Siembra', 'description' => 'Actividad esencial de Siembra. Relacionada con el inicio del ciclo de producción.', 'default_priority' => 'medium'],
        ['system_code' => 'GRAFTING', 'name' => 'Injerto', 'description' => 'Actividad esencial de Injerto. Se requiere para el avance de fase en lotes injertados.', 'default_priority' => 'high'],
        ['system_code' => 'DISPATCH', 'name' => 'Despacho', 'description' => 'Actividad esencial de Despacho. Relacionada con la salida y entrega de plantines.', 'default_priority' => 'medium'],
    ];

    public function up(): void
    {
        $now = now();

        $viveros = DB::table('viveros')->pluck('id');

        foreach ($viveros as $viveroId) {
            $existingCodes = DB::table('activity_types')
                ->where('vivero_id', $viveroId)
                ->whereNotNull('system_code')
                ->pluck('system_code');

            $rows = collect(self::SYSTEM_ACTIVITY_TYPES)
                ->reject(fn (array $type) => $existingCodes->contains($type['system_code']))
                ->map(fn (array $type) => $type + [
                    'vivero_id' => $viveroId,
                    'is_system' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all();

            if (! empty($rows)) {
                DB::table('activity_types')->insert($rows);
            }
        }
    }

    public function down(): void
    {
        // Backfill de datos: no se revierte para no borrar actividades (y tareas ya
        // creadas sobre ellas) que pudieron crearse después de este seed.
    }
};
