<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_type_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_type_id')->constrained()->cascadeOnDelete();
            $table->string('resource_type', 20); // 'tool' | 'supply'
            $table->unsignedBigInteger('resource_id');
            $table->decimal('quantity', 10, 2)->default(1);
            $table->timestamps();

            $table->unique(['activity_type_id', 'resource_type', 'resource_id'], 'activity_type_resource_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_type_resources');
    }
};
