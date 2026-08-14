<?php

namespace App\Modules\Synchronization\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Synchronization\Models\SyncNode;
use App\Modules\Synchronization\Repositories\Contracts\SyncNodeRepositoryInterface;

class SyncNodeRepository extends BaseRepository implements SyncNodeRepositoryInterface
{
    public function __construct(SyncNode $model)
    {
        parent::__construct($model);
    }

    public function find($id): SyncNode
    {
        /** @var SyncNode */
        return parent::find($id);
    }

    public function findActive(string $id): ?SyncNode
    {
        return $this->model
            ->newQuery()
            ->whereKey($id)
            ->where('is_active', true)
            ->first();
    }

    public function updateOrCreate(array $identity, array $data): SyncNode
    {
        /** @var SyncNode */
        return $this->model->newQuery()->updateOrCreate($identity, $data);
    }

    public function updateNode(SyncNode $node, array $data): SyncNode
    {
        $node->update($data);

        return $node->refresh();
    }
}
