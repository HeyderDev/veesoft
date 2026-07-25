<?php

namespace App\Modules\Inventory\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SupplyRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateOrderedBySku(int $perPage = 15, ?string $search = null): LengthAwarePaginator;

    public function generateUniqueSku(): string;
}
