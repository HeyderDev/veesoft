<?php

namespace App\Modules\Logistics\Repositories\Eloquent;

use App\Modules\Logistics\Models\PurchaseOrderItem;
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
            ->with(['evaluations' => fn ($query) => $query->orderByDesc('created_at')])
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
        $supplierId = PurchaseOrderItem::query()
            ->where('item_sku', $itemSku)
            ->join('purchase_orders', 'purchase_orders.id', '=', 'purchase_order_items.purchase_order_id')
            ->join('suppliers', 'suppliers.id', '=', 'purchase_orders.supplier_id')
            ->where('suppliers.status', Supplier::STATUS_ACTIVE)
            ->orderByDesc('suppliers.score')
            ->value('suppliers.id');

        return $supplierId ? $this->model->find($supplierId) : null;
    }
}
