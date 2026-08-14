<?php

namespace App\Modules\Synchronization\Repositories\Contracts;

use App\Modules\Synchronization\Models\SyncEntityState;

interface SyncEntityStateRepositoryInterface
{
    public function findByEntity(string $entityType, string $entityId): ?SyncEntityState;

    public function findForUpdate(string $entityType, string $entityId): ?SyncEntityState;

    public function create(array $data): SyncEntityState;

    public function updateState(SyncEntityState $state, array $data): SyncEntityState;
}
