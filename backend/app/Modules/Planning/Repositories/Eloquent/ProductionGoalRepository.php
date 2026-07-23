<?php

namespace App\Modules\Planning\Repositories\Eloquent;

use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Repositories\Contracts\ProductionGoalRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductionGoalRepository extends BaseRepository implements ProductionGoalRepositoryInterface
{
    public function __construct(ProductionGoal $model)
    {
        parent::__construct($model);
    }

    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->with(['vivero', 'creator'])
            ->withSum('dispatches as produced_seedlings', 'quantity')
            ->orderByDesc('created_at')->paginate($perPage);
    }

    public function findWithRelations(int $id)
    {
        return $this->model->with(['vivero', 'creator'])
            ->withSum('dispatches as produced_seedlings', 'quantity')
            ->findOrFail($id);
    }

    public function findOpenForVivero(int $viveroId)
    {
        return $this->model->where('vivero_id', $viveroId)
            ->withSum('dispatches as produced_seedlings', 'quantity')
            ->whereNull('finished_at')->first();
    }

    public function sumDispatchedQuantity(int $goalId): int
    {
        return (int) $this->model->findOrFail($goalId)->dispatches()->sum('quantity');
    }
}
