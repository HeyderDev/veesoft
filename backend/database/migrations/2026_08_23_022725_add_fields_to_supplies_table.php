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
        Schema::table('supplies', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->decimal('max_stock', 10, 2)->nullable();
            $table->string('batch')->nullable();
            $table->date('entry_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->string('supplier')->nullable();
            $table->string('location')->nullable();
            $table->string('status')->default('active');
            
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
        Schema::table('supplies', function (Blueprint $table) {
            $table->dropColumn([
                'description', 'category', 'max_stock', 'batch', 'entry_date', 
                'expiration_date', 'supplier', 'location', 'status',
                'sync_id', 'origin_node', 'origin_module', 'sync_status'
            ]);
        });
    }
};
