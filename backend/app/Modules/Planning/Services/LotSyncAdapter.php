<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Repositories\Contracts\LotRepositoryInterface;
use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Services\SyncEntityAdapter;

class LotSyncAdapter implements SyncEntityAdapter
{
    public function __construct(
        private readonly LotRepositoryInterface $lots,
    ) {}

    public function entityType(): string
    {
        return 'planning.lot';
    }

    public function export(string $entityId): ?array
    {
        $lot = $this->lots->find($entityId);

        return [
            'vivero_id' => $lot->vivero_id,
            'code' => $lot->code,
            'name' => $lot->name,
            'funda_diameter' => $lot->funda_diameter,
            'width' => $lot->width,
            'length' => $lot->length,
            'corridor_count' => $lot->corridor_count,
            'corridor_width' => $lot->corridor_width,
            'calculated_capacity' => $lot->calculated_capacity,
            'total_capacity' => $lot->total_capacity,
            'current_status' => $lot->current_status,
            'position_x' => $lot->position_x,
            'position_y' => $lot->position_y,
            'notes' => $lot->notes,
        ];
    }

    public function apply(
        string $entityId,
        SyncOperation $operation,
        ?array $payload,
    ): void {
        if ($operation === SyncOperation::DELETED) {
            $this->lots->deleteForSync($entityId);

            return;
        }

        $this->lots->upsertForSync($entityId, $payload ?? []);
    }
}
