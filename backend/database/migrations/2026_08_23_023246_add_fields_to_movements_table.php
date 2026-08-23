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
        Schema::table('movements', function (Blueprint $table) {
            $table->decimal('previous_stock', 10, 2)->nullable();
            $table->decimal('new_stock', 10, 2)->nullable();
            $table->string('reason')->nullable();
            $table->string('scanned_code')->nullable();
            $table->string('batch')->nullable();
            
            // Offline fields
            $table->uuid('sync_id')->nullable()->unique();
            $table->string('origin_node')->nullable();
            $table->string('origin_module')->nullable();
            $table->string('sync_status')->default('synchronized');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movements', function (Blueprint $table) {
            $table->dropColumn([
                'previous_stock', 'new_stock', 'reason', 'scanned_code', 'batch',
                'sync_id', 'origin_node', 'origin_module', 'sync_status'
            ]);
        });
    }
};
