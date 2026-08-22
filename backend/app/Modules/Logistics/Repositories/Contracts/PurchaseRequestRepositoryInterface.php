<?php

namespace App\Modules\Logistics\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PurchaseRequestRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator;

    public function findWithRelations(int $id);
}
