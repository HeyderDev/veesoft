<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Ajuste de Fase 5: Siembra e Injertación pasan de una duración estimada fija
 * (3 y 15 días) a arrancar en 1 día, igual que Despacho — si la actividad
 * obligatoria correspondiente se demora, la fase se extiende sola y las
 * siguientes se recalculan en cascada (ver GatedPhaseCatalog,
 * LotCycleService::markGateSatisfied()). ProductionPhaseService::DEFAULT_PHASES
 * ya quedó en 1 día para viveros nuevos; esto ajusta los viveros que ya
 * existían con los valores anteriores. No toca lot_cycle_phases de ciclos ya
 * en curso — su calendario ya calculado sigue como estaba, solo el catálogo
 * (production_phases) queda listo para los próximos ciclos que se inicien.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('production_phases')
            ->whereIn('code', ['SIEM', 'INJER', 'DESP'])
            ->update(['estimated_duration_days' => 1]);
    }

    public function down(): void
    {
        // No hay un valor "anterior" único que restaurar de forma confiable
        // (distintos viveros pudieron haber tenido distintos valores editados a
        // mano) — no se revierte.
    }
};
