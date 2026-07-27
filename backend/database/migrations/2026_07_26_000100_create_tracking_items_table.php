<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracking_items', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('species', 100);
            $table->string('stage', 30)->default('germination');
            $table->integer('quantity')->default(0);
            $table->string('unit', 20)->default('unidades');
            $table->string('location', 150);
            $table->integer('minimum_stock')->default(0);
            $table->text('notes')->nullable();
            $table->dateTime('registered_at');
            $table->timestamps();
            $table->softDeletes();

            $table->index('stage');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_items');
    }
};
