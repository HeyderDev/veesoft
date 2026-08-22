<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Tracking\Repositories\Contracts\TrackingLotRepositoryInterface;
use App\Modules\Tracking\Repositories\Contracts\TrackingMovementRepositoryInterface;

class TrackingLotService
{
    public function __construct(
        private TrackingLotRepositoryInterface $lotRepository,
        private TrackingMovementRepositoryInterface $movementRepository,
    ) {}

    public function list()
    {
        return $this->lotRepository->allWithVivero();
    }

    /**
     * Lote (de Planning) + su historial de movimientos de salida — es lo que se
     * muestra al "entrar" a un lote desde la vista de tarjetas.
     */
    public function getDetail(int $lotId): array
    {
        return [
            'lot' => $this->lotRepository->find($lotId),
            'movements' => $this->movementRepository->paginateWithFilters($lotId, perPage: 50),
        ];
    }
}
