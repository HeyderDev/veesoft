<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Tracking\Models\TrackingMovement;
use App\Modules\Tracking\Repositories\Contracts\TrackingLotRepositoryInterface;
use App\Modules\Tracking\Repositories\Contracts\TrackingMovementRepositoryInterface;

/**
 * Solo registra salidas (despachos a un cliente) de un lote de Planning — no hay
 * entradas ni existencia propia que ajustar, a diferencia del diseño anterior.
 */
class TrackingMovementService
{
    public function __construct(
        private TrackingMovementRepositoryInterface $movementRepository,
        private TrackingLotRepositoryInterface $lotRepository,
    ) {}

    public function list(?int $lotId = null, int $perPage = 15)
    {
        return $this->movementRepository->paginateWithFilters($lotId, $perPage);
    }

    public function register(array $data): TrackingMovement
    {
        $lot = $this->lotRepository->find($data['lot_id']);
        $quantity = (int) $data['quantity'];

        if ($quantity > $lot->total_capacity) {
            throw new \DomainException(
                "La cantidad ({$quantity}) no puede superar la capacidad del lote ({$lot->total_capacity})."
            );
        }

        $data['movement_date'] = $data['movement_date'] ?? now();

        return $this->movementRepository->create($data);
    }
}
