<?php

namespace App\Modules\Planning\Repositories\Eloquent;

use App\Modules\Planning\Models\LotCycle;
use App\Modules\Planning\Repositories\Contracts\LotCycleRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Support\Collection;

class LotCycleRepository extends BaseRepository implements LotCycleRepositoryInterface
{
    public function __construct(LotCycle $model)
    {
        parent::__construct($model);
    }

    public function findActiveForLot(int $lotId)
    {
        return $this->model->where('lot_id', $lotId)->where('status', LotCycle::STATUS_IN_PROGRESS)->first();
    }

    public function findWithPhases(int $id)
    {
        return $this->model->with(['phases' => fn ($q) => $q->orderBy('planned_start_date'), 'phases.phase', 'lot'])
            ->findOrFail($id);
    }

    public function allActiveWithPhasesForVivero(int $viveroId): Collection
    {
        return $this->model->where('status', LotCycle::STATUS_IN_PROGRESS)
            ->whereHas('lot', fn ($q) => $q->where('vivero_id', $viveroId))
            ->with(['phases' => fn ($q) => $q->orderBy('planned_start_date'), 'phases.phase'])
            ->get();
    }
}
