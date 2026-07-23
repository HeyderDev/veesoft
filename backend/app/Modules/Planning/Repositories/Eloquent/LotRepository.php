<?php

namespace App\Modules\Planning\Repositories\Eloquent;

use App\Modules\Planning\Models\Lot;
use App\Modules\Planning\Repositories\Contracts\LotRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class LotRepository extends BaseRepository implements LotRepositoryInterface
{
    public function __construct(Lot $model)
    {
        parent::__construct($model);
    }

    public function paginateOrderedByCode(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->with(['vivero', 'activeCycle.phases.phase'])->orderBy('code')->paginate($perPage);
    }

    public function findWithCycles(int $id)
    {
        return $this->model
            ->with(['vivero', 'activeCycle.phases.phase', 'lotCycles' => fn ($q) => $q->orderByDesc('started_at')])
            ->findOrFail($id);
    }

    public function generateUniqueCode(): string
    {
        $count = $this->model->count() + 1;
        $code = 'LOT-'.str_pad((string) $count, 3, '0', STR_PAD_LEFT);

        while ($this->model->where('code', $code)->exists()) {
            $count++;
            $code = 'LOT-'.str_pad((string) $count, 3, '0', STR_PAD_LEFT);
        }

        return $code;
    }

    public function allForVivero(int $viveroId): Collection
    {
        return $this->model
            ->with(['activeCycle.phases.phase'])
            ->where('vivero_id', $viveroId)
            ->get();
    }
}
