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

    public function paginateOrderedByCode(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('code')->paginate($perPage);
    }

    public function generateUniqueCode(): string
    {
        $maxId = $this->model->max('id') ?? 0;
        $nextId = $maxId + 1;

        return 'HERR-'.str_pad($nextId, 3, '0', STR_PAD_LEFT);
    }

    public function findByCode(string $code)
    {
        return $this->model->where('code', $code)->firstOrFail();
    }
}
