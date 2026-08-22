<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignId('evaluated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('compliance');
            $table->unsignedTinyInteger('quality');
            $table->unsignedTinyInteger('punctuality');
            $table->unsignedTinyInteger('price');
            $table->unsignedTinyInteger('after_sales_service');
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_evaluations');
    }
};
