<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operational_task_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('operational_task_id')->constrained()->cascadeOnDelete();
            $table->string('resource_type', 20); // 'tool' | 'supply'
            $table->unsignedBigInteger('resource_id');
            $table->timestamps();

            $table->unique(['operational_task_id', 'resource_type', 'resource_id'], 'task_resource_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operational_task_resources');
    }
};
