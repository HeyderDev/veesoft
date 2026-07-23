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
        Schema::create('climate_event_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('climate_event_id')->constrained('climate_events')->cascadeOnDelete();
            $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
            $table->string('impact_level', 30);
            $table->text('observations')->nullable();
            $table->timestamps(); // Changed from no timestamps just to keep consistent
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('climate_event_lots');
    }
};
