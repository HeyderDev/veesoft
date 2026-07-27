<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracking_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tracking_item_id')->constrained('tracking_items')->cascadeOnDelete();
            $table->string('type', 10);
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
