<?php

namespace App\Modules\Logistics\Repositories\Eloquent;

use App\Modules\Logistics\Models\Supplier;
use App\Modules\Logistics\Repositories\Contracts\SupplierRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SupplierRepository extends BaseRepository implements SupplierRepositoryInterface
{
    public function __construct(Supplier $model)
    {
        parent::__construct($model);
    }

    public function paginateOrderedByScore(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->orderByDesc('score')->orderBy('name')->paginate($perPage);
    }

    public function findWithRelations(int $id)
    {
        return $this->model
            ->with(['evaluations' => fn ($query) => $query->orderByDesc('created_at'), 'supplies'])
            ->findOrFail($id);
    }

    public function existsWithTaxId(string $taxId, ?int $excludingId = null): bool
    {
        return $this->model
            ->where('tax_id', $taxId)
            ->when($excludingId, fn ($query) => $query->where('id', '!=', $excludingId))
            ->exists();
    }

    public function findBestForItemSku(string $itemSku)
    {
        $supplierId = $this->model
            ->where('status', Supplier::STATUS_ACTIVE)
            ->whereHas('supplies', fn ($query) => $query->where('sku', $itemSku))
            ->orderByDesc('score')
            ->value('id');

        return $supplierId ? $this->model->find($supplierId) : null;
    }
}
