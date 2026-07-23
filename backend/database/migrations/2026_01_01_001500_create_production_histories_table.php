<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reservada para el módulo Tracking (ver docs/03_MODULE_CONTRACTS/Tracking.md) —
     * vive aquí temporalmente. Repuntada a lots tras el rediseño de Fases.
     */
    public function up(): void
    {
        Schema::create('production_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
            $table->integer('total_seedlings_produced');
            $table->integer('total_seedlings_dispatched');
            $table->decimal('mortality_percentage', 5, 2)->default(0);
            $table->integer('average_cycle_duration_days');
            $table->integer('delayed_phases_count')->default(0);
            $table->integer('climate_incidents_count')->default(0);
            $table->decimal('operational_score', 5, 2)->default(0);
            $table->text('observations')->nullable();
            $table->dateTime('generated_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_histories');
    }
};
