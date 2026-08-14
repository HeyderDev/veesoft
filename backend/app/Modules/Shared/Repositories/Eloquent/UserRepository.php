<?php

namespace App\Modules\Shared\Repositories\Eloquent;

use App\Modules\Shared\Models\User;
use App\Modules\Shared\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class UserRepository extends BaseRepository implements UserRepositoryInterface
{
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    public function activeForSelection(): Collection
    {
        return $this->model
            ->newQuery()
            ->select('id', 'first_name', 'last_name')
            ->where('status', 'active')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }
}
