<?php

namespace App\Modules\Inventory\Events;

use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Events\SyncableDomainEvent;
use App\Modules\Synchronization\Traits\HasSyncMetadata;
use Illuminate\Foundation\Events\Dispatchable;

class InventoryMovementCreated implements SyncableDomainEvent
{
    use Dispatchable, HasSyncMetadata;

    public function __construct(string|int $movementId)
    {
        $this->initializeSyncMetadata(
            'inventory.movement',
            $movementId,
            SyncOperation::CREATED,
        );
    }
}
