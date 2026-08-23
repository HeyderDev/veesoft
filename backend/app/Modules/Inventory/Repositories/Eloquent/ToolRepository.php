<?php

namespace App\Modules\Inventory\Repositories\Eloquent;

use App\Modules\Inventory\Models\Tool;
use App\Modules\Inventory\Repositories\Contracts\ToolRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ToolRepository extends BaseRepository implements ToolRepositoryInterface
{
    public function __construct(Tool $model)
    {
        parent::__construct($model);
    }

    public function paginateWithUnits(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $query = $this->model->newQuery()->with('units')->withCount(['units', 'units as available_units_count' => function ($q) {
            $q->where('status', 'available');
        }, 'units as borrowed_units_count' => function ($q) {
            $q->where('status', 'borrowed');
        }, 'units as maintenance_units_count' => function ($q) {
            $q->whereIn('status', ['maintenance', 'damaged']);
        }]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('name')->paginate($perPage);
    }
}
