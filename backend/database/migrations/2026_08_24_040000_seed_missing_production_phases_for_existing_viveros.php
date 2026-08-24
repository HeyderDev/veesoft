<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * "Fase 1: vivero como espacio de trabajo global" (0f3e94f) volvió production_phases
 * una tabla por-vivero (vivero_id + unique(vivero_id, code)), con el catálogo por
 * defecto creado solo para viveros nuevos vía ViveroService::create() ->
 * ProductionPhaseService::seedDefaultsForVivero(). Los viveros que ya existían antes
 * de ese cambio (p. ej. creados directo en BD/seeder) se quedaron sin fases: como
 * ProductionPhase tiene scope global por vivero_id, startCycle() los ve con un
 * catálogo vacío y lanza "No hay fases configuradas para este vivero" — el error
 * reportado en Planificación. Este backfill les crea el mismo set de 6 fases por
 * defecto que reciben los viveros nuevos.
 */
return new class extends Migration
{
    private const DEFAULT_PHASES = [
        ['code' => 'PREP', 'name' => 'Preparación', 'description' => 'Preparación del sustrato y llenado de fundas.', 'execution_order' => 1, 'estimated_duration_days' => 7, 'color_reference' => '#d97706'],
        ['code' => 'SIEM', 'name' => 'Siembra', 'description' => 'Siembra de la semilla en las fundas preparadas.', 'execution_order' => 2, 'estimated_duration_days' => 3, 'color_reference' => '#65a30d'],
        ['code' => 'CREC_INI', 'name' => 'Crecimiento Inicial', 'description' => 'Periodo de germinación y primer crecimiento del patrón.', 'execution_order' => 3, 'estimated_duration_days' => 30, 'color_reference' => '#16a34a'],
        ['code' => 'INJER', 'name' => 'Injertación', 'description' => 'Proceso de injerto sobre el patrón desarrollado.', 'execution_order' => 4, 'estimated_duration_days' => 15, 'color_reference' => '#0284c7'],
        ['code' => 'DESA', 'name' => 'Desarrollo', 'description' => 'Desarrollo de la planta injertada hasta su punto de venta.', 'execution_order' => 5, 'estimated_duration_days' => 60, 'color_reference' => '#4338ca'],
        ['code' => 'DESP', 'name' => 'Despacho', 'description' => 'Periodo de preparación y salida de las plantas.', 'execution_order' => 6, 'estimated_duration_days' => 5, 'color_reference' => '#be123c'],
    ];

    public function up(): void
    {
        $viverosSinFases = DB::table('viveros')
            ->whereNotIn('id', DB::table('production_phases')->select('vivero_id'))
            ->pluck('id');

        $now = now();

        foreach ($viverosSinFases as $viveroId) {
            $rows = array_map(
                fn (array $phase) => $phase + ['vivero_id' => $viveroId, 'created_at' => $now, 'updated_at' => $now],
                self::DEFAULT_PHASES
            );

            DB::table('production_phases')->insert($rows);
        }
    }

    public function down(): void
    {
        // Backfill de datos: no se revierte para no borrar fases (y ciclos ya
        // programados sobre ellas) que pudieron crearse después de este seed.
    }
};
