<?php

namespace App\Modules\Planning\Repositories\Eloquent;

use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Models\Vivero;
use App\Modules\Planning\Repositories\Contracts\ViveroRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ViveroRepository extends BaseRepository implements ViveroRepositoryInterface
{
    public function __construct(Vivero $model)
    {
        parent::__construct($model);
    }

    public function paginateWithCurrentMeta(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with(['metas' => fn ($query) => $query->whereNull('finished_at')->latest()])
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findWithRelations(int $id)
    {
        return $this->model
            ->with(['metas' => fn ($query) => $query->orderByDesc('created_at'), 'lots'])
            ->findOrFail($id);
    }

    public function hasOpenGoal(int $viveroId): bool
    {
        return ProductionGoal::where('vivero_id', $viveroId)->whereNull('finished_at')->exists();
    }
}
