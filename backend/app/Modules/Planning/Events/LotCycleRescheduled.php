<?php

namespace App\Modules\Planning\Events;

use App\Modules\Planning\Models\LotCycle;
use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Events\SyncableDomainEvent;
use App\Modules\Synchronization\Traits\HasSyncMetadata;
use Illuminate\Foundation\Events\Dispatchable;

class LotCycleRescheduled implements SyncableDomainEvent
{
    use Dispatchable, HasSyncMetadata;

    public function __construct(LotCycle $cycle)
    {
        $this->initializeSyncMetadata(
            'planning.lot-cycle',
            $cycle->getKey(),
            SyncOperation::UPDATED,
        );
    }
}
