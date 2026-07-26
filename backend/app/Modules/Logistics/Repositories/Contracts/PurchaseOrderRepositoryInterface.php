<?php

namespace App\Modules\Logistics\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface PurchaseOrderRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator;

    public function findWithRelations(int $id);

    public function paginateForSupplier(int $supplierId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Ítems de órdenes en estado 'issued'/'sent', para el calendario de entregas
     * pendientes con semáforo de urgencia (ver PurchaseOrderService::pendingDeliveries()).
     */
    public function findPendingItems(): Collection;

    /**
     * Siguiente correlativo sugerido para 'N° de Orden' (ver PurchaseOrderService::create()).
     */
    public function nextOrderNumber(): string;
}
