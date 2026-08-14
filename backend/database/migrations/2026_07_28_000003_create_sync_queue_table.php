<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_queue', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id');
            $table->string('direction', 20)->default('outbound');
            $table->string('entity_type', 100);
            $table->string('entity_id', 64);
            $table->string('operation', 20);
            $table->foreignUuid('origin_node_id')
                ->constrained('sync_nodes')
                ->restrictOnDelete();
            $table->foreignUuid('target_node_id')
                ->constrained('sync_nodes')
                ->restrictOnDelete();
            $table->unsignedBigInteger('base_version')->default(0);
            $table->unsignedBigInteger('entity_version');
            $table->unsignedBigInteger('remote_version')->nullable();
            $table->string('status', 20)->default('pending');
            $table->unsignedSmallInteger('priority')->default(100);
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestampTz('occurred_at');
            $table->timestampTz('available_at')->nullable();
            $table->timestampTz('locked_at')->nullable();
            $table->uuid('lock_token')->nullable();
            $table->json('payload')->nullable();
            $table->char('payload_hash', 64)->nullable();
            $table->unsignedSmallInteger('last_http_status')->nullable();
            $table->text('last_error')->nullable();
            $table->timestampTz('synced_at')->nullable();
            $table->timestampTz('conflicted_at')->nullable();
            $table->timestampsTz();

            $table->unique(
                ['event_id', 'target_node_id'],
                'sync_queue_event_target_unique'
            );
            $table->index(
                ['status', 'available_at', 'priority'],
                'sync_queue_worker_idx'
            );
            $table->index(
                ['target_node_id', 'status', 'available_at'],
                'sync_queue_target_status_idx'
            );
            $table->index(
                ['entity_type', 'entity_id', 'created_at'],
                'sync_queue_entity_created_idx'
            );
            $table->index(
                ['origin_node_id', 'occurred_at'],
                'sync_queue_origin_occurred_idx'
            );
            $table->index(
                ['status', 'locked_at'],
                'sync_queue_lock_recovery_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_queue');
    }
};
