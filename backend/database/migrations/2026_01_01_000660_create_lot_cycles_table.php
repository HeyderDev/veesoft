<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Un "lot_cycle" es una pasada completa de un lote por las 6 fases, desde que se
     * presiona "Comenzar Ciclo" hasta que se presiona "Terminar Despacho". Un lote
     * puede acumular varios lot_cycles a lo largo de su vida (histórico, nunca se
     * elimina), pero solo uno puede estar "in_progress" a la vez.
     */
    public function up(): void
    {
        Schema::create('lot_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
            $table->foreignId('production_goal_id')->constrained('production_goals')->cascadeOnDelete();
            $table->date('started_at');
            $table->string('status', 30)->default('in_progress'); // in_progress | dispatched
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lot_cycles');
    }
};
