<?php

namespace App\Modules\Shared\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface extends BaseRepositoryInterface
{
    public function activeForSelection(): Collection;
}
