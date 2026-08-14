<?php

namespace App\Modules\Synchronization\Services;

use App\Modules\Synchronization\Enums\SyncConflictStatus;
use App\Modules\Synchronization\Models\SyncConflict;
use App\Modules\Synchronization\Models\SyncQueue;
use App\Modules\Synchronization\Repositories\Contracts\SyncConflictRepositoryInterface;

class SyncConflictService
{
    public function __construct(
        private readonly SyncConflictRepositoryInterface $conflicts,
    ) {}

    public function record(
        SyncQueue $queueEntry,
        int $localVersion,
        string $reason,
        ?array $localPayload,
        ?array $incomingPayload,
    ): SyncConflict {
        return $this->conflicts->create([
            'sync_queue_id' => $queueEntry->id,
            'event_id' => $queueEntry->event_id,
            'entity_type' => $queueEntry->entity_type,
            'entity_id' => $queueEntry->entity_id,
            'local_version' => $localVersion,
            'incoming_base_version' => $queueEntry->base_version,
            'incoming_entity_version' => $queueEntry->entity_version,
            'local_payload' => $localPayload,
            'incoming_payload' => $incomingPayload,
            'reason' => $reason,
            'status' => SyncConflictStatus::OPEN,
        ]);
    }
}
