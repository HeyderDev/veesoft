<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_conflicts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sync_queue_id')
                ->constrained('sync_queue')
                ->restrictOnDelete();
            $table->uuid('event_id');
            $table->string('entity_type', 100);
            $table->string('entity_id', 64);
            $table->unsignedBigInteger('local_version');
            $table->unsignedBigInteger('incoming_base_version');
            $table->unsignedBigInteger('incoming_entity_version');
            $table->json('local_payload')->nullable();
            $table->json('incoming_payload')->nullable();
            $table->string('reason', 100);
            $table->string('status', 20)->default('open');
            $table->string('resolution', 30)->nullable();
            $table->foreignId('resolved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestampTz('resolved_at')->nullable();
            $table->timestampsTz();

            $table->index(
                ['status', 'created_at'],
                'sync_conflicts_status_created_idx'
            );
            $table->index(
                ['entity_type', 'entity_id'],
                'sync_conflicts_entity_idx'
            );
            $table->index('event_id', 'sync_conflicts_event_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_conflicts');
    }
};
