<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vivero_id')->constrained('viveros')->cascadeOnDelete();
            $table->string('code', 50)->unique();
            $table->string('name', 100);

            // Geometría usada para calcular la capacidad de plántulas.
            $table->decimal('funda_diameter', 5, 2)->default(12);
            $table->decimal('width', 10, 2);
            $table->decimal('length', 10, 2);
            $table->unsignedInteger('corridor_count')->default(0);
            $table->decimal('corridor_width', 6, 2)->default(0);

            // calculated_capacity es la base geométrica inmutable; total_capacity es el
            // valor autoritativo que usa el resto del sistema y puede ajustarse dentro
            // de un margen de tolerancia respecto a calculated_capacity (ver LotService).
            $table->unsignedInteger('calculated_capacity');
            $table->unsignedInteger('total_capacity');

            $table->string('current_status', 30)->default('available');

            // Posición libre dentro del tablero visual de lotes (arrastrar y soltar).
            $table->decimal('position_x', 10, 2)->nullable();
            $table->decimal('position_y', 10, 2)->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lots');
    }
};
