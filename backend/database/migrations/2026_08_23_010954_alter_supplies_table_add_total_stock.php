<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            $table->decimal('total_stock', 10, 2)->default(0)->after('unit');
            $table->dropColumn('min_stock');
        });

        // Initialize total_stock to current_stock for existing data
        DB::table('supplies')->update([
            'total_stock' => DB::raw('current_stock')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            $table->decimal('min_stock', 10, 2)->default(0);
            $table->dropColumn('total_stock');
        });
    }
};
