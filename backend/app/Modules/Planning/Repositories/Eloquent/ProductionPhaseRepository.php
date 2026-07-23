<?php

namespace App\Modules\Planning\Repositories\Eloquent;

use App\Modules\Planning\Models\ProductionPhase;
use App\Modules\Planning\Repositories\Contracts\ProductionPhaseRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Support\Collection;

class ProductionPhaseRepository extends BaseRepository implements ProductionPhaseRepositoryInterface
{
    public function __construct(ProductionPhase $model)
    {
        parent::__construct($model);
    }

    public function allOrderedByExecutionForVivero(int $viveroId): Collection
    {
        return $this->model->where('vivero_id', $viveroId)->orderBy('execution_order')->get();
    }

    public function allOrderedByExecution(): Collection
    {
        return $this->model->orderBy('vivero_id')->orderBy('execution_order')->get();
    }
}
