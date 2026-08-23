<?php

namespace App\Modules\Inventory\Repositories\Eloquent;

use App\Modules\Inventory\Models\Movement;
use App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MovementRepository extends BaseRepository implements MovementRepositoryInterface
{
    public function __construct(Movement $model)
    {
        parent::__construct($model);
    }

    public function paginateWithRelations(int $perPage = 15, ?string $type = null, ?string $search = null, ?string $startDate = null, ?string $endDate = null): LengthAwarePaginator
    {
        $query = $this->model->with(['tool', 'supply', 'user', 'toolUnit']);

        if ($type) {
            $query->where('type', strtoupper($type));
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('details', 'like', "%{$search}%")
                    ->orWhereHas('tool', function ($t) use ($search) {
                        $t->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('toolUnit', function ($tu) use ($search) {
                        $tu->where('code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('supply', function ($s) use ($search) {
                        $s->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        return $query->latest('id')->paginate($perPage);
    }
}
