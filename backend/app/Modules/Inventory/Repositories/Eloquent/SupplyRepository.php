<?php

namespace App\Modules\Inventory\Repositories\Eloquent;

use App\Modules\Inventory\Models\Supply;
use App\Modules\Inventory\Repositories\Contracts\SupplyRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SupplyRepository extends BaseRepository implements SupplyRepositoryInterface
{
    public function __construct(Supply $model)
    {
        parent::__construct($model);
    }

    public function paginateOrderedBySku(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('sku')->paginate($perPage);
    }

    public function generateUniqueSku(): string
    {
        $maxId = $this->model->max('id') ?? 0;
        $nextId = $maxId + 1;
        return 'INS-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
    }
}
