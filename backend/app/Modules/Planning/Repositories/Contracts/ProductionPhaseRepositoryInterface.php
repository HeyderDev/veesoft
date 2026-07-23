<?php

namespace App\Modules\Planning\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Support\Collection;

interface ProductionPhaseRepositoryInterface extends BaseRepositoryInterface
{
    public function allOrderedByExecutionForVivero(int $viveroId): Collection;

    /**
     * Fases de TODOS los viveros — usado únicamente para listarlas en el frontend
     * (que filtra client-side por vivero_id, igual que /lots).
     */
    public function allOrderedByExecution(): Collection;
}
