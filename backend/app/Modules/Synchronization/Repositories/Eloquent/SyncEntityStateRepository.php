<?php

namespace App\Modules\Synchronization\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Synchronization\Models\SyncEntityState;
use App\Modules\Synchronization\Repositories\Contracts\SyncEntityStateRepositoryInterface;

class SyncEntityStateRepository extends BaseRepository implements SyncEntityStateRepositoryInterface
{
    public function __construct(SyncEntityState $model)
    {
        parent::__construct($model);
    }

    public function findByEntity(string $entityType, string $entityId): ?SyncEntityState
    {
        return $this->queryByEntity($entityType, $entityId)->first();
    }

    public function findForUpdate(string $entityType, string $entityId): ?SyncEntityState
    {
        return $this->queryByEntity($entityType, $entityId)
            ->lockForUpdate()
            ->first();
    }

    public function create(array $data): SyncEntityState
    {
        /** @var SyncEntityState */
        return parent::create($data);
    }

    public function updateState(SyncEntityState $state, array $data): SyncEntityState
    {
        $state->update($data);

        return $state->refresh();
    }

    private function queryByEntity(string $entityType, string $entityId)
    {
        return $this->model
            ->newQuery()
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId);
    }
}
