<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Services\SyncEntityAdapter;
use App\Modules\Tracking\Repositories\Contracts\TrackingMovementRepositoryInterface;

class TrackingMovementSyncAdapter implements SyncEntityAdapter
{
    public function __construct(
        private readonly TrackingMovementRepositoryInterface $movements,
    ) {}

    public function entityType(): string
    {
        return 'tracking.movement';
    }

    public function export(string $entityId): ?array
    {
        $movement = $this->movements->find($entityId);

        return [
            'lot_id' => $movement->lot_id,
            'tracking_client_id' => $movement->tracking_client_id,
            'quantity' => $movement->quantity,
            'movement_date' => $movement->getRawOriginal('movement_date'),
            'notes' => $movement->notes,
        ];
    }

    public function apply(
        string $entityId,
        SyncOperation $operation,
        ?array $payload,
    ): void {
        if ($operation === SyncOperation::DELETED) {
            $this->movements->deleteForSync($entityId);

            return;
        }

        $this->movements->upsertForSync($entityId, $payload ?? []);
    }
}
