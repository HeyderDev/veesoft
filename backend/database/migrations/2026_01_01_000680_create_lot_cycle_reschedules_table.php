<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Registro histórico (append-only, nunca se edita ni se borra) de cada vez que se
     * reprograma el paso de una fase a la siguiente dentro de un lot_cycle — adelanto o
     * atraso frente a la fecha originalmente calculada. Ver LotCycleService::reschedule().
     */
    public function up(): void
    {
        Schema::create('lot_cycle_reschedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_cycle_id')->constrained('lot_cycles')->cascadeOnDelete();
            $table->foreignId('from_phase_id')->constrained('production_phases')->cascadeOnDelete();
            $table->foreignId('to_phase_id')->constrained('production_phases')->cascadeOnDelete();
            $table->date('previous_transition_date');
            $table->date('new_transition_date');
            $table->foreignId('rescheduled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lot_cycle_reschedules');
    }
};
