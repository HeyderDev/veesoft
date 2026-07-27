<?php

namespace App\Modules\Tracking\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TrackingMovementRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Historial paginado, más reciente primero, opcionalmente filtrado por ítem.
     */
    public function paginateWithFilters(?int $trackingItemId, int $perPage = 15): LengthAwarePaginator;
}
