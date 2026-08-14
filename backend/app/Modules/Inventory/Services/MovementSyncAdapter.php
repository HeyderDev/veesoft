<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface;
use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Services\SyncEntityAdapter;

class MovementSyncAdapter implements SyncEntityAdapter
{
    public function __construct(
        private readonly MovementRepositoryInterface $movements,
    ) {}

    public function entityType(): string
    {
        return 'inventory.movement';
    }

    public function export(string $entityId): ?array
    {
        $movement = $this->movements->find($entityId);

        return [
            'tool_id' => $movement->tool_id,
            'supply_id' => $movement->supply_id,
            'user_id' => $movement->user_id,
            'type' => $movement->type,
            'quantity' => $movement->quantity,
            'details' => $movement->details,
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
