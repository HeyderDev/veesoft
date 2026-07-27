<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Tracking\Models\TrackingMovement;
use App\Modules\Tracking\Repositories\Contracts\TrackingItemRepositoryInterface;
use App\Modules\Tracking\Repositories\Contracts\TrackingMovementRepositoryInterface;
use Illuminate\Support\Facades\DB;

/**
 * Reglas de negocio del movimiento de inventario:
 * - `entry` suma la cantidad al ítem, `exit` la resta.
 * - Una `exit` nunca puede dejar la existencia del ítem en negativo (el proyecto
 *   anterior no validaba esto — se corrige aquí).
 * - Registrar el movimiento y ajustar la existencia del ítem es una única operación
 *   atómica (DB::transaction).
 */
class TrackingMovementService
{
    public function __construct(
        private TrackingMovementRepositoryInterface $movementRepository,
        private TrackingItemRepositoryInterface $itemRepository,
    ) {}

    public function list(?int $trackingItemId = null, int $perPage = 15)
    {
        return $this->movementRepository->paginateWithFilters($trackingItemId, $perPage);
    }

    public function register(array $data): TrackingMovement
    {
        return DB::transaction(function () use ($data) {
            $item = $this->itemRepository->find($data['tracking_item_id']);
            $quantity = (int) $data['quantity'];

            if ($data['type'] === TrackingMovement::TYPE_EXIT && $quantity > $item->quantity) {
                throw new \DomainException(
                    "La salida ({$quantity}) no puede dejar la existencia en negativo. Existencia actual: {$item->quantity}."
                );
            }

            $data['movement_date'] = $data['movement_date'] ?? now();

            $movement = $this->movementRepository->create($data);

            $newQuantity = $data['type'] === TrackingMovement::TYPE_ENTRY
                ? $item->quantity + $quantity
                : $item->quantity - $quantity;

            $this->itemRepository->update($item->id, ['quantity' => $newQuantity]);

            return $movement;
        });
    }
}
