<?php

namespace App\Modules\Tasks\Services;

use App\Modules\Tasks\Models\ActivityType;

/**
 * Única fuente de verdad de las 3 plantillas de actividad obligatorias del
 * sistema (Siembra/Injerto/Despacho — ver GatedPhaseCatalog). La usan tanto
 * SystemActivityTypesSeeder (arranque de la app) como
 * Tasks\Listeners\CreateTaskForGatedPhase (defensivo: cubre viveros creados
 * vía ViveroService::create(), que hoy solo siembra production_phases).
 */
class ActivityTypeService
{
    private const SYSTEM_DEFAULTS = [
        [
            'system_code' => 'SEEDING',
            'name' => 'Siembra',
            'description' => 'Actividad esencial de Siembra. Relacionada con el inicio del ciclo de producción.',
            'default_priority' => 'medium',
        ],
        [
            'system_code' => 'GRAFTING',
            'name' => 'Injerto',
            'description' => 'Actividad esencial de Injerto. Se requiere para el avance de fase en lotes injertados.',
            'default_priority' => 'high',
        ],
        [
            'system_code' => 'DISPATCH',
            'name' => 'Despacho',
            'description' => 'Actividad esencial de Despacho. Relacionada con la salida y entrega de plantines.',
            'default_priority' => 'medium',
        ],
    ];

    public function seedSystemDefaultsForVivero(int $viveroId): void
    {
        foreach (self::SYSTEM_DEFAULTS as $definition) {
            ActivityType::firstOrCreate(
                ['vivero_id' => $viveroId, 'system_code' => $definition['system_code']],
                [...$definition, 'is_system' => true],
            );
        }
    }
}
