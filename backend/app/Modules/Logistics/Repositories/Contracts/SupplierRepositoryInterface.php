<?php

namespace App\Modules\Logistics\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SupplierRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateOrderedByScore(int $perPage = 20): LengthAwarePaginator;

    public function findWithRelations(int $id);

    public function existsWithTaxId(string $taxId, ?int $excludingId = null): bool;

    /**
     * Mejor proveedor (score más alto, activo) que ha suministrado un ítem por su SKU,
     * según el historial de `purchase_order_items`. Es el método público que consumen
     * otros módulos (ver docs/03_MODULE_CONTRACTS/Logistics.md).
     */
    public function findBestForItemSku(string $itemSku);
}
