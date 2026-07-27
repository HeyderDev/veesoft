<?php

namespace App\Modules\Tracking\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Tracking\Models\TrackingMovement;
use App\Modules\Tracking\Repositories\Contracts\TrackingMovementRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TrackingMovementRepository extends BaseRepository implements TrackingMovementRepositoryInterface
{
    public function __construct(TrackingMovement $model)
    {
        parent::__construct($model);
    }

    public function paginateWithFilters(?int $trackingItemId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with('trackingItem')
            ->when($trackingItemId, fn ($q) => $q->where('tracking_item_id', $trackingItemId))
            ->orderByDesc('movement_date')
            ->paginate($perPage);
    }
}
