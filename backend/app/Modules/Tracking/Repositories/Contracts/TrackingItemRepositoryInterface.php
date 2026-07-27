<?php

namespace App\Modules\Tracking\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface TrackingItemRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Listado paginado con búsqueda por nombre/especie/ubicación y filtro por etapa,
     * ordenado por nombre.
     */
    public function paginateWithFilters(?string $search, ?string $stage, int $perPage = 15): LengthAwarePaginator;

    public function findWithMovements(int $id);

    /**
     * Todos los ítems cuya cantidad ya llegó o bajó del stock mínimo — sin paginar,
     * usado por el resumen de alertas.
     */
    public function allBelowMinimumStock(): Collection;
}
