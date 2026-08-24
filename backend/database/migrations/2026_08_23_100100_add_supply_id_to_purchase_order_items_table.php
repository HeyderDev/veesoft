<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('purchase_order_items', 'supply_id')) {
            Schema::table('purchase_order_items', function (Blueprint $table) {
                $table->foreignId('supply_id')->nullable()->after('purchase_order_id');
            });
        }

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->foreign('supply_id')->references('id')->on('supplies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supply_id');
        });
    }
};
