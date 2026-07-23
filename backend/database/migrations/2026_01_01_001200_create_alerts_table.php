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
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
            $table->string('title', 150);
            $table->string('alert_type', 50);
            $table->string('severity', 30);
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->dateTime('generated_at');
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps(); // Keeping standard timestamps
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
