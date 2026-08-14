<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Services\SyncEntityAdapter;
use App\Modules\Tracking\Repositories\Contracts\DispatchReportRepositoryInterface;

class DispatchSyncAdapter implements SyncEntityAdapter
{
    public function __construct(
        private readonly DispatchReportRepositoryInterface $dispatches,
    ) {}

    public function entityType(): string
    {
        return 'tracking.dispatch';
    }

    public function export(string $entityId): ?array
    {
        return $this->dispatches->exportForSync($entityId);
    }

    public function apply(
        string $entityId,
        SyncOperation $operation,
        ?array $payload,
    ): void {
        if ($operation === SyncOperation::DELETED) {
            $this->dispatches->deleteForSync($entityId);

            return;
        }

        $this->dispatches->upsertForSync($entityId, $payload ?? []);
    }
}
