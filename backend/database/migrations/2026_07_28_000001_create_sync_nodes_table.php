<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_nodes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->string('node_type', 20);
            $table->string('base_url')->nullable();
            $table->char('token_hash', 64)->nullable();
            $table->string('token_prefix', 12)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('last_seen_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['node_type', 'is_active'], 'sync_nodes_type_active_idx');
            $table->index('last_seen_at', 'sync_nodes_last_seen_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_nodes');
    }
};
