<?php

namespace App\Modules\Tracking\Repositories\Eloquent;

use App\Modules\Planning\Models\Lot;
use App\Modules\Tracking\Repositories\Contracts\TrackingLotRepositoryInterface;
use Illuminate\Support\Collection;

class TrackingLotRepository implements TrackingLotRepositoryInterface
{
    public function allWithVivero(): Collection
    {
        return Lot::with('vivero')->orderBy('code')->get();
    }

    public function find(int $id): Lot
    {
        return Lot::with('vivero')->findOrFail($id);
    }
}
