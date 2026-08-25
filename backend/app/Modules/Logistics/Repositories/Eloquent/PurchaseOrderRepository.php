<?php

namespace App\Modules\Logistics\Repositories\Eloquent;

use App\Modules\Logistics\Models\PurchaseOrder;
use App\Modules\Logistics\Repositories\Contracts\PurchaseOrderRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PurchaseOrderRepository extends BaseRepository implements PurchaseOrderRepositoryInterface
{
    public function __construct(PurchaseOrder $model)
    {
        parent::__construct($model);
    }

    public function paginateWithRelations(int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->with(['supplier', 'creator', 'items', 'receipt'])
            ->orderByDesc('created_at')->paginate($perPage);
    }

    public function findWithRelations(int $id)
    {
        return $this->model->with(['supplier', 'creator', 'items', 'receipt'])->findOrFail($id);
    }

    public function paginateForSupplier(int $supplierId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('supplier_id', $supplierId)
            ->with('items')
            ->orderByDesc('issued_at')
            ->paginate($perPage);
    }

    public function findPendingItems(): Collection
    {
        return $this->model
            ->whereIn('status', [PurchaseOrder::STATUS_ISSUED, PurchaseOrder::STATUS_SENT])
            ->with(['supplier', 'items'])
            ->orderBy('estimated_delivery_date')
            ->get();
    }

    public function nextOrderNumber(): string
    {
        $maxNumber = $this->model->pluck('order_number')
            ->map(fn ($orderNumber) => (int) $orderNumber)
            ->max() ?? 0;

        return (string) ($maxNumber + 1);
    }
}
