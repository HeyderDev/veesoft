<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marca cuándo se satisfizo la actividad obligatoria de una fase gateada
 * (Siembra/Injertación/Despacho — ver GatedPhaseCatalog). Mientras sea NULL en
 * una de esas 3 fases, LotCycleService::computeCurrentPhase() la mantiene como
 * "actual" sin importar que ya venció su planned_end_date.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lot_cycle_phases', function (Blueprint $table) {
            $table->timestamp('gate_completed_at')->nullable()->after('planned_end_date');
        });
    }

    public function down(): void
    {
        Schema::table('lot_cycle_phases', function (Blueprint $table) {
            $table->dropColumn('gate_completed_at');
        });
    }
};
