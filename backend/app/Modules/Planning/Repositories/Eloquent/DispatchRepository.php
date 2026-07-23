<?php

namespace App\Modules\Planning\Repositories\Eloquent;

use App\Modules\Planning\Models\Dispatch;
use App\Modules\Planning\Repositories\Contracts\DispatchRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;

class DispatchRepository extends BaseRepository implements DispatchRepositoryInterface
{
    public function __construct(Dispatch $model)
    {
        parent::__construct($model);
    }
}
