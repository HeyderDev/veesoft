<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Se crea al presionar "Terminar Despacho" sobre un lote en fase de Despacho.
     * Registra cuántas plántulas se despacharon realmente y a qué Meta de producción
     * abona ese avance.
     */
    public function up(): void
    {
        Schema::create('dispatches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
            $table->foreignId('lot_cycle_id')->constrained('lot_cycles')->cascadeOnDelete();
            $table->foreignId('production_goal_id')->constrained('production_goals')->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->date('dispatched_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispatches');
    }
};
