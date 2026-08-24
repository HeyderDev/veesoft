<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('suppliers', 'vivero_id')) {
            Schema::table('suppliers', function (Blueprint $table) {
                $table->foreignId('vivero_id')->nullable()->after('id');
            });
        }

        Schema::table('suppliers', function (Blueprint $table) {
            $table->foreign('vivero_id')->references('id')->on('viveros')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vivero_id');
        });
    }
};
