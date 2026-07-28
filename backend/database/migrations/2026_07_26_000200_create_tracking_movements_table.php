<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Solo movimientos de SALIDA (despacho a un cliente) — no hay entrada, ya
     * que los lotes se crean y administran en Planning, no en Tracking.
     */
    public function up(): void
    {
        Schema::create('tracking_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
            $table->foreignId('tracking_client_id')->constrained('tracking_clients');
            $table->integer('quantity');
            $table->dateTime('movement_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_movements');
    }
};
