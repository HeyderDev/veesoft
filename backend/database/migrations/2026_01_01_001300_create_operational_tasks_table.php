<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reservada para el módulo Tasks (ver docs/03_MODULE_CONTRACTS/Tasks.md) — vive
     * aquí temporalmente. Repuntada a lot_cycle_phases tras el rediseño de Fases.
     */
    public function up(): void
    {
        Schema::create('operational_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_cycle_phase_id')->constrained('lot_cycle_phases')->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('priority', 30);
            $table->dateTime('planned_date');
            $table->dateTime('completed_date')->nullable();
            $table->string('status', 30)->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operational_tasks');
    }
};
