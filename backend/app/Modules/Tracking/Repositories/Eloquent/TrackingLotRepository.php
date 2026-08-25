<?php

namespace App\Modules\Tracking\Repositories\Eloquent;

use App\Modules\Planning\Models\Lot;
use App\Modules\Tracking\Repositories\Contracts\TrackingLotRepositoryInterface;
use Illuminate\Support\Collection;

class TrackingLotRepository implements TrackingLotRepositoryInterface
{
    public function allWithVivero(?int $goalId = null): Collection
    {
        return Lot::with(['vivero', 'activeCycle.phases.phase'])
            ->when($goalId, fn ($q) => $q->whereHas('lotCycles', fn ($cq) => $cq->where('production_goal_id', $goalId)))
            ->orderBy('code')
            ->get();
    }

    public function find(int $id): Lot
    {
        return Lot::with('vivero')->findOrFail($id);
    }
}
