<?php

namespace App\Modules\Synchronization\Jobs;

use App\Modules\Synchronization\Services\PushSynchronizationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class PushSyncQueueJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(
        public readonly string $syncQueueId,
    ) {}

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function handle(PushSynchronizationService $synchronization): void
    {
        $synchronization->process($this->syncQueueId);
    }
}
