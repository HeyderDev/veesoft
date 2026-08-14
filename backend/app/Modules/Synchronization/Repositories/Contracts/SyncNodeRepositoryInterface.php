<?php

namespace App\Modules\Synchronization\Repositories\Contracts;

use App\Modules\Synchronization\Models\SyncNode;

interface SyncNodeRepositoryInterface
{
    public function find(string $id): SyncNode;

    public function findActive(string $id): ?SyncNode;

    public function updateOrCreate(array $identity, array $data): SyncNode;

    public function updateNode(SyncNode $node, array $data): SyncNode;
}
