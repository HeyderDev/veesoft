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
        Schema::table('production_phases', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->foreignId('vivero_id')->after('id')->constrained('viveros')->cascadeOnDelete();
            $table->unique(['vivero_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_phases', function (Blueprint $table) {
            $table->dropUnique(['vivero_id', 'code']);
            $table->dropConstrainedForeignId('vivero_id');
            $table->unique(['code']);
        });
    }
};
