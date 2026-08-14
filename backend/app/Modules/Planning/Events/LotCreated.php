<?php

namespace App\Modules\Planning\Events;

use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Events\SyncableDomainEvent;
use App\Modules\Synchronization\Traits\HasSyncMetadata;
use Illuminate\Foundation\Events\Dispatchable;

class LotCreated implements SyncableDomainEvent
{
    use Dispatchable, HasSyncMetadata;

    public function __construct(string|int $lotId)
    {
        $this->initializeSyncMetadata(
            'planning.lot',
            $lotId,
            SyncOperation::CREATED,
        );
    }
}
