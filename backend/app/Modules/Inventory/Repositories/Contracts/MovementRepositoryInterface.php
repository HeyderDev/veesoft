<?php

namespace App\Modules\Inventory\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface MovementRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateWithRelations(int $perPage = 15, ?string $type = null, ?string $search = null, ?string $startDate = null, ?string $endDate = null): LengthAwarePaginator;
}
