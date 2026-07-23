<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Calendario calculado de un lot_cycle: fecha planificada de inicio/fin de cada
     * fase, según las duraciones configuradas en lot_phase_durations al momento de
     * iniciar el ciclo. La "fase actual" no se guarda como columna — se calcula
     * comparando la fecha de hoy contra estos rangos (ver LotCycleService).
     */
    public function up(): void
    {
        Schema::create('lot_cycle_phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_cycle_id')->constrained('lot_cycles')->cascadeOnDelete();
            $table->foreignId('phase_id')->constrained('production_phases')->cascadeOnDelete();
            $table->date('planned_start_date');
            $table->date('planned_end_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lot_cycle_phases');
    }
};
