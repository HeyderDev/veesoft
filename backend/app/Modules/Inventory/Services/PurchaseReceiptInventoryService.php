<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Movement;
use App\Modules\Inventory\Models\Supply;
use App\Modules\Inventory\Models\ToolUnit;
use App\Modules\Logistics\Models\PurchaseOrder;
use App\Modules\Logistics\Models\PurchaseOrderItem;
use Illuminate\Support\Collection;

/**
 * Registra en Inventario las existencias recibidas de una orden de compra.
 * Las compras nunca crean un catálogo nuevo: siempre actualizan el ítem que
 * Logistics ya vinculó a la orden (supply_id o tool_id).
 */
class PurchaseReceiptInventoryService
{
    /** @param Collection<int, PurchaseOrderItem> $items */
    public function apply(PurchaseOrder $order, Collection $items, ?int $receivedBy): void
    {
        foreach ($items as $item) {
            if ($item->supply_id) {
                $this->receiveSupply($order, $item, $receivedBy);
                continue;
            }

            if ($item->tool_id) {
                $this->receiveToolUnits($order, $item, $receivedBy);
            }
        }
    }

    private function receiveSupply(PurchaseOrder $order, PurchaseOrderItem $item, ?int $receivedBy): void
    {
        $supply = Supply::query()->lockForUpdate()->findOrFail($item->supply_id);
        $previousStock = (float) $supply->current_stock;
        $quantity = (float) $item->quantity;
        $newStock = $previousStock + $quantity;

        $supply->update([
            'current_stock' => $newStock,
            'total_stock' => (float) $supply->total_stock + $quantity,
        ]);

        Movement::create([
            'supply_id' => $supply->id,
            'user_id' => $receivedBy,
            'type' => 'ENTRADA',
            'quantity' => $quantity,
            'previous_stock' => $previousStock,
            'new_stock' => $newStock,
            'reason' => "Recepción de orden {$order->order_number}",
            'details' => [
                'usuario' => 'Logística',
                'detalles' => "Ingreso automático por recepción de orden {$order->order_number}.",
            ],
        ]);
    }

    private function receiveToolUnits(PurchaseOrder $order, PurchaseOrderItem $item, ?int $receivedBy): void
    {
        $quantity = (float) $item->quantity;

        if (floor($quantity) !== $quantity) {
            throw new \DomainException('Las herramientas deben recibirse en unidades enteras.');
        }

        for ($index = 0; $index < (int) $quantity; $index++) {
            $unit = ToolUnit::create([
                'tool_id' => $item->tool_id,
                'purchase_order_item_id' => $item->id,
                'code' => $this->nextToolUnitCode(),
                'status' => 'available',
            ]);

            Movement::create([
                'tool_id' => $item->tool_id,
                'tool_unit_id' => $unit->id,
                'user_id' => $receivedBy,
                'type' => Movement::TYPE_ADJUSTMENT,
                'quantity' => 1,
                'reason' => "Recepción de orden {$order->order_number}",
                'details' => [
                    'usuario' => 'Logística',
                    'detalles' => "Nueva unidad recibida por orden {$order->order_number}.",
                ],
            ]);
        }
    }

    private function nextToolUnitCode(): string
    {
        $nextId = (ToolUnit::withoutGlobalScopes()->max('id') ?? 0) + 1;

        return 'HER-'.str_pad((string) $nextId, 6, '0', STR_PAD_LEFT);
    }
}
