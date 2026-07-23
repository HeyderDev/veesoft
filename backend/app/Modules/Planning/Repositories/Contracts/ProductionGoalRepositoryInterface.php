<?php

namespace App\Modules\Planning\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProductionGoalRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator;

    public function findWithRelations(int $id);

    public function findOpenForVivero(int $viveroId);

    public function sumDispatchedQuantity(int $goalId): int;
}
