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

        // Un lote "disponible" está vacío (sin ciclo en curso) — no hay nada que
        // despachar todavía. Solo un lote "ocupado" (con un ciclo activo) puede
        // recibir salidas.
        if (! $lot->activeCycle) {
            throw new \DomainException('Este lote no tiene un ciclo de producción en curso — no se pueden registrar salidas hasta que tenga plántulas en producción.');
        }

        if ($quantity > $lot->total_capacity) {
            throw new \DomainException(
                "La cantidad ({$quantity}) no puede superar la capacidad del lote ({$lot->total_capacity})."
            );
        }

        // Se anida al ciclo activo del lote (si tiene uno) — es lo que permite
        // sumar después "cuánto salió de este ciclo" al completar la actividad
        // de Despacho (ver DispatchReportService::previewFromMovements()).
        $cycle = $lot->activeCycle;
        $data['lot_cycle_id'] = $cycle?->id;

        if ($cycle) {
            $alreadyRegistered = TrackingMovement::where('lot_cycle_id', $cycle->id)->sum('quantity');

            if ($alreadyRegistered + $quantity > $lot->total_capacity) {
                $remaining = max(0, $lot->total_capacity - $alreadyRegistered);
                throw new \DomainException(
                    "La cantidad ({$quantity}) supera lo que queda disponible para despachar en este ciclo ({$remaining} de {$lot->total_capacity})."
                );
            }
        }

        $data['movement_date'] = $data['movement_date'] ?? now();

        return $this->movementRepository->create($data);
    }
}
