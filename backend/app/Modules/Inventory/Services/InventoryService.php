<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Events\InventoryMovementCreated;
use App\Modules\Inventory\Models\Movement;
use App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface;
use App\Modules\Inventory\Repositories\Contracts\SupplyRepositoryInterface;
use Illuminate\Support\Facades\DB;

/**
 * Public service exposed to other modules (Logistics, Planning, Tasks).
 */
class InventoryService
{
    public function __construct(
        private SupplyRepositoryInterface $supplyRepository,
        private MovementRepositoryInterface $movementRepository
    ) {}

    public function getStockLevel(string $itemCode): int
    {
        $supply = $this->supplyRepository->findBy('sku', $itemCode);

        return $supply ? (int) $supply->current_stock : 0;
    }

    public function reserveMaterials(array $items): bool
    {
        return DB::transaction(function () use ($items) {
            foreach ($items as $item) {
                $supply = $this->supplyRepository->findBy('sku', $item['sku']);
                if (! $supply || $supply->current_stock < $item['quantity']) {
                    return false;
                }

                $newStock = $supply->current_stock - $item['quantity'];
                $this->supplyRepository->update($supply->id, ['current_stock' => $newStock]);

                $movement = $this->movementRepository->create([
                    'supply_id' => $supply->id,
                    'type' => Movement::TYPE_ADJUSTMENT,
                    'quantity' => $item['quantity'],
                    'details' => ['usuario' => 'Sistema', 'detalles' => 'Reserva de material: '.($item['reason'] ?? 'N/A')],
                ]);
                event(new InventoryMovementCreated($movement->id));
            }

            return true;
        });
    }

    public function registerConsumption(array $items, string $reason): void
    {
        $this->reserveMaterials(array_map(fn ($item) => array_merge($item, ['reason' => $reason]), $items));
    }
}
