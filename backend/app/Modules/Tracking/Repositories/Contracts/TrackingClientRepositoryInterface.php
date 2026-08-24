<?php

namespace App\Modules\Tracking\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TrackingClientRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Listado paginado con búsqueda por nombre o cédula.
     */
    public function paginateWithSearch(?string $search, int $perPage = 15): LengthAwarePaginator;
}
