<?php

namespace App\Modules\Planning\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Support\Collection;

interface LotCycleRepositoryInterface extends BaseRepositoryInterface
{
    public function findActiveForLot(int $lotId);

    public function findWithPhases(int $id);

    /**
     * Todos los ciclos "in_progress" de lotes de un vivero, con sus fases — usado
     * para reprogramar en masa cuando cambia la duración de una fase de ese vivero.
     */
    public function allActiveWithPhasesForVivero(int $viveroId): Collection;
}
