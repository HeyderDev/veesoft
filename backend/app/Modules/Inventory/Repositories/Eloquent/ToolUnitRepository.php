<?php

namespace App\Modules\Inventory\Repositories\Eloquent;

use App\Modules\Inventory\Models\ToolUnit;
use App\Modules\Inventory\Repositories\Contracts\ToolUnitRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;

class ToolUnitRepository extends BaseRepository implements ToolUnitRepositoryInterface
{
    public function __construct(ToolUnit $model)
    {
        parent::__construct($model);
    }

    public function generateUniqueCode(): string
    {
        $maxId = $this->model->max('id') ?? 0;
        $nextId = $maxId + 1;

        return 'HER-'.str_pad($nextId, 6, '0', STR_PAD_LEFT);
    }

    public function findByCode(string $code)
    {
        return $this->model->where('code', $code)->firstOrFail();
    }
}
