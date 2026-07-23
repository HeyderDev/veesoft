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
        Schema::create('climate_events', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->string('event_type', 50);
            $table->string('severity', 30);
            $table->dateTime('start_date');
            $table->dateTime('end_date')->nullable();
            $table->string('affected_zone', 100)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('climate_events');
    }
};
