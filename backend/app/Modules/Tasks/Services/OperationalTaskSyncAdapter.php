<?php

namespace App\Modules\Tasks\Services;

use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Services\SyncEntityAdapter;
use App\Modules\Tasks\Repositories\Contracts\OperationalTaskRepositoryInterface;

class OperationalTaskSyncAdapter implements SyncEntityAdapter
{
    public function __construct(
        private readonly OperationalTaskRepositoryInterface $tasks,
    ) {}

    public function entityType(): string
    {
        return 'tasks.operational-task';
    }

    public function export(string $entityId): ?array
    {
        return $this->tasks->exportForSync($entityId);
    }

    public function apply(
        string $entityId,
        SyncOperation $operation,
        ?array $payload,
    ): void {
        if ($operation === SyncOperation::DELETED) {
            $this->tasks->deleteForSync($entityId);

            return;
        }

        $this->tasks->applySynchronizedState($entityId, $payload ?? []);
    }
}
