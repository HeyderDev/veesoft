<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->foreignId('supply_id')->nullable()->after('purchase_request_id')
                ->constrained('supplies')->nullOnDelete();
            $table->foreignId('tool_id')->nullable()->after('supply_id')
                ->constrained('tools')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supply_id');
            $table->dropConstrainedForeignId('tool_id');
        });
    }
};
