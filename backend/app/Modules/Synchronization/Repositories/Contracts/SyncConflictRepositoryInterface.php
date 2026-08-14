<?php

namespace App\Modules\Synchronization\Repositories\Contracts;

use App\Modules\Synchronization\Models\SyncConflict;

interface SyncConflictRepositoryInterface
{
    public function create(array $data): SyncConflict;
}
