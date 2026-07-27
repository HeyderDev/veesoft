<?php

namespace App\Modules\Tracking\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Tracking\Models\TrackingItem;
use App\Modules\Tracking\Repositories\Contracts\TrackingItemRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class TrackingItemRepository extends BaseRepository implements TrackingItemRepositoryInterface
{
    public function __construct(TrackingItem $model)
    {
        parent::__construct($model);
    }

    public function paginateWithFilters(?string $search, ?string $stage, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->when($search, fn ($q) => $q->where(fn ($q2) => $q2
                ->where('name', 'like', "%{$search}%")
                ->orWhere('species', 'like', "%{$search}%")
                ->orWhere('location', 'like', "%{$search}%")
            ))
            ->when($stage, fn ($q) => $q->where('stage', $stage))
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findWithMovements(int $id)
    {
        return $this->model->with('movements')->findOrFail($id);
    }

    public function allBelowMinimumStock(): Collection
    {
        return $this->model->whereColumn('quantity', '<=', 'minimum_stock')->orderBy('name')->get();
    }
}
