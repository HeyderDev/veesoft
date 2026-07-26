<?php

namespace App\Modules\Logistics\Events;

use App\Modules\Logistics\Models\PurchaseOrder;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Support\Collection;

/**
 * Se dispara cuando una orden de compra se recibe con calidad 'approved' o 'conditional'.
 * Logistics no escribe stock directamente: `insumos` pertenece al módulo Inventory, que
 * todavía no existe en este repositorio. Cuando exista, su listener debe incrementar el
 * stock de cada insumo a partir de `$items` (item_sku, quantity) — ver
 * docs/03_MODULE_CONTRACTS/Logistics.md.
 */
class PurchaseOrderReceived
{
    use Dispatchable;

    public function __construct(
        public readonly PurchaseOrder $purchaseOrder,
        public readonly Collection $items,
    ) {}
}
