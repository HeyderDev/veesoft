<?php

namespace App\Modules\Tracking\Events;

use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Events\SyncableDomainEvent;
use App\Modules\Synchronization\Traits\HasSyncMetadata;
use Illuminate\Foundation\Events\Dispatchable;

class TrackingMovementRegistered implements SyncableDomainEvent
{
    use Dispatchable, HasSyncMetadata;

    public function __construct(string|int $movementId)
    {
        $this->initializeSyncMetadata(
            'tracking.movement',
            $movementId,
            SyncOperation::CREATED,
        );
    }
}
