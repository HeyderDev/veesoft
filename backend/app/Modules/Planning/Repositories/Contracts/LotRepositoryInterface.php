<?php

namespace App\Modules\Planning\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface LotRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateOrderedByCode(int $perPage = 15): LengthAwarePaginator;

    public function findWithCycles(int $id);

    /**
     * Genera un código único con formato LOT-XXX para lotes creados sin código explícito.
     */
    public function generateUniqueCode(): string;

    /**
     * Todos los lotes de un vivero con su ciclo activo y fases, sin paginar — usado por
     * el resumen para calcular la distribución de plántulas por fase actual.
     */
    public function allForVivero(int $viveroId): Collection;
}
