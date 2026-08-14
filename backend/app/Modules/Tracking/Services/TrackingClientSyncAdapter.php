<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Services\SyncEntityAdapter;
use App\Modules\Tracking\Repositories\Contracts\TrackingClientRepositoryInterface;

class TrackingClientSyncAdapter implements SyncEntityAdapter
{
    public function __construct(
        private readonly TrackingClientRepositoryInterface $clients,
    ) {}

    public function entityType(): string
    {
        return 'tracking.client';
    }

    public function export(string $entityId): ?array
    {
        $client = $this->clients->find($entityId);

        return [
            'name' => $client->name,
            'cedula' => $client->cedula,
            'phone' => $client->phone,
        ];
    }

    public function apply(
        string $entityId,
        SyncOperation $operation,
        ?array $payload,
    ): void {
        if ($operation === SyncOperation::DELETED) {
            $this->clients->deleteForSync($entityId);

            return;
        }

        $this->clients->upsertForSync($entityId, $payload ?? []);
    }
}
