<?php

namespace App\Modules\Tasks\Events;

use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Events\SyncableDomainEvent;
use App\Modules\Synchronization\Traits\HasSyncMetadata;
use Illuminate\Foundation\Events\Dispatchable;

class OperationalTaskCompleted implements SyncableDomainEvent
{
    use Dispatchable, HasSyncMetadata;

    public function __construct(string|int $taskId)
    {
        $this->initializeSyncMetadata(
            'tasks.operational-task',
            $taskId,
            SyncOperation::UPDATED,
        );
    }
}
