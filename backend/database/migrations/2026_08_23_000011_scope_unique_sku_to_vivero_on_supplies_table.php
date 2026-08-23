<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            $table->dropUnique(['sku']);
            $table->unique(['vivero_id', 'sku']);
        });
    }

    public function down(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            $table->dropUnique(['vivero_id', 'sku']);
            $table->unique(['sku']);
        });
    }
};
