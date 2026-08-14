<?php

namespace App\Modules\Synchronization\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Synchronization\Models\SyncConflict;
use App\Modules\Synchronization\Repositories\Contracts\SyncConflictRepositoryInterface;

class SyncConflictRepository extends BaseRepository implements SyncConflictRepositoryInterface
{
    public function __construct(SyncConflict $model)
    {
        parent::__construct($model);
    }

    public function create(array $data): SyncConflict
    {
        /** @var SyncConflict */
        return parent::create($data);
    }
}
