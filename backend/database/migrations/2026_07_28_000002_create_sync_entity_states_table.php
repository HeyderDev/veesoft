<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_entity_states', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('entity_type', 100);
            $table->string('entity_id', 64);
            $table->foreignUuid('origin_node_id')
                ->constrained('sync_nodes')
                ->restrictOnDelete();
            $table->unsignedBigInteger('version')->default(0);
            $table->unsignedBigInteger('synced_version')->default(0);
            $table->char('content_hash', 64)->nullable();
            $table->timestampTz('tombstoned_at')->nullable();
            $table->timestampsTz();

            $table->unique(
                ['entity_type', 'entity_id'],
                'sync_entity_states_entity_unique'
            );
            $table->index(
                ['origin_node_id', 'updated_at'],
                'sync_entity_states_origin_updated_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_entity_states');
    }
};
