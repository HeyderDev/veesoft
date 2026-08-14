<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Repositories\Contracts\LotCycleRepositoryInterface;
use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Services\SyncEntityAdapter;

class LotCycleSyncAdapter implements SyncEntityAdapter
{
    public function __construct(
        private readonly LotCycleRepositoryInterface $cycles,
    ) {}

    public function entityType(): string
    {
        return 'planning.lot-cycle';
    }

    public function export(string $entityId): ?array
    {
        return $this->cycles->exportForSync($entityId);
    }

    public function apply(
        string $entityId,
        SyncOperation $operation,
        ?array $payload,
    ): void {
        if ($operation === SyncOperation::DELETED) {
            $this->cycles->deleteForSync($entityId);

            return;
        }

        $this->cycles->applySynchronizedState($entityId, $payload ?? []);
    }
}
