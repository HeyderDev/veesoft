<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Tracking\Repositories\Contracts\TrackingLotRepositoryInterface;
use App\Modules\Tracking\Repositories\Contracts\TrackingMovementRepositoryInterface;

/**
 * Agrega datos de Lot (Planning) y TrackingMovement/TrackingClient para las dos
 * vistas de Reportes: general (totales globales) y por lote (historial de
 * salidas con cliente) — no posee su propia tabla, por eso no extiende BaseService.
 */
class TrackingSummaryService
{
    public function __construct(
        private TrackingLotRepositoryInterface $lotRepository,
        private TrackingMovementRepositoryInterface $movementRepository,
    ) {}

    public function getGeneralSummary(): array
    {
        return [
            'total_lots' => $this->lotRepository->allWithVivero()->count(),
            'total_dispatched' => $this->movementRepository->totalQuantity(),
            'top_clients' => $this->movementRepository->topClients(),
        ];
    }

    public function getLotSummary(int $lotId): array
    {
        return [
            'lot' => $this->lotRepository->find($lotId),
            'movements' => $this->movementRepository->paginateWithFilters($lotId, perPage: 100),
        ];
    }
}
