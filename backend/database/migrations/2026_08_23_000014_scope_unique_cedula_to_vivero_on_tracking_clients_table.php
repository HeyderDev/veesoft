<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tracking_clients', function (Blueprint $table) {
            $table->dropUnique(['cedula']);
            $table->unique(['vivero_id', 'cedula']);
        });
    }

    public function down(): void
    {
        Schema::table('tracking_clients', function (Blueprint $table) {
            $table->dropUnique(['vivero_id', 'cedula']);
            $table->unique(['cedula']);
        });
    }
};
