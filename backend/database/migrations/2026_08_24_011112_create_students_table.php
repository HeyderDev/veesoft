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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vivero_id')->constrained()->cascadeOnDelete();
            $table->string('cedula');
            $table->string('name');
            $table->string('career')->nullable(); // Carrera o especialidad
            $table->string('email')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Un vivero no puede tener 2 estudiantes con la misma cédula
            $table->unique(['vivero_id', 'cedula']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
