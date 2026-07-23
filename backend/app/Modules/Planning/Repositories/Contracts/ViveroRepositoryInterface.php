<?php

namespace App\Modules\Planning\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ViveroRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateWithCurrentMeta(int $perPage = 15): LengthAwarePaginator;

    public function findWithRelations(int $id);

    /**
     * ¿Este vivero tiene alguna meta no culminada (finished_at nulo)?
     * Usado por ProductionGoalService para bloquear la creación de una segunda meta activa.
     */
    public function hasOpenGoal(int $viveroId): bool;
}
