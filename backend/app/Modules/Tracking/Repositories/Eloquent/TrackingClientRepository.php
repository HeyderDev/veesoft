<?php

namespace App\Modules\Tracking\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Tracking\Models\TrackingClient;
use App\Modules\Tracking\Repositories\Contracts\TrackingClientRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TrackingClientRepository extends BaseRepository implements TrackingClientRepositoryInterface
{
    public function __construct(TrackingClient $model)
    {
        parent::__construct($model);
    }

    public function paginateWithSearch(?string $search, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->when($search, fn ($q) => $q->where(fn ($q2) => $q2
                ->where('name', 'like', "%{$search}%")
                ->orWhere('cedula', 'like', "%{$search}%")
            ))
            ->orderBy('name')
            ->paginate($perPage);
    }
}
