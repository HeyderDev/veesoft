<?php

namespace App\Modules\Inventory\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ToolRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateOrderedByCode(int $perPage = 15, ?string $search = null): LengthAwarePaginator;
    
    public function generateUniqueCode(): string;
}
