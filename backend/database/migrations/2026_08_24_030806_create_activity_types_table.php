<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vivero_id')->constrained('viveros')->cascadeOnDelete();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->string('system_code', 50)->nullable();
            $table->string('default_priority', 30)->default('normal');
            $table->timestamps();

            // Un vivero no debería tener dos actividades del sistema con el mismo código.
            $table->unique(['vivero_id', 'system_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_types');
    }
};
