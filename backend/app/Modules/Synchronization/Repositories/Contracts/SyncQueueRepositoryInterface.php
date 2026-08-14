<?php

namespace App\Modules\Synchronization\Repositories\Contracts;

use App\Modules\Synchronization\Models\SyncQueue;
use Illuminate\Support\Collection;

interface SyncQueueRepositoryInterface
{
    public function create(array $data): SyncQueue;

    public function find(string $id): SyncQueue;

    public function findForUpdate(string $id): ?SyncQueue;

    public function findDelivery(string $eventId, string $targetNodeId): ?SyncQueue;

    public function duePending(int $limit): Collection;

    public function updateEntry(SyncQueue $entry, array $data): SyncQueue;
}
