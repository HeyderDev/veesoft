<?php

namespace App\Modules\Synchronization\Listeners;

use App\Modules\Synchronization\Events\SyncableDomainEvent;
use App\Modules\Synchronization\Services\SynchronizationContext;
use App\Modules\Synchronization\Services\SyncQueueService;

class QueueSyncableDomainEvent
{
    public function __construct(
        private readonly SyncQueueService $queue,
        private readonly SynchronizationContext $context,
    ) {}

    public function handle(SyncableDomainEvent $event): void
    {
        if ($this->context->isReceiving()) {
            return;
        }

        $this->queue->enqueue($event);
    }
}
