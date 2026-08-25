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
        private TrackingLotService $lotService,
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

    /**
     * Panel informativo de la vista de tarjetas de Seguimiento: plántulas en
     * producción (capacidad de lotes con ciclo activo), plántulas ya
     * despachadas (histórico de movimientos) y próximas fechas de despacho
     * (lotes cuya fase actual es DESP, ordenados por fecha).
     */
    public function getProductionSummary(): array
    {
        $lots = $this->lotService->list();

        $totalInProduction = 0;
        $upcomingDispatches = [];

        foreach ($lots as $lot) {
            if ($lot['current_status'] !== 'occupied') {
                continue;
            }

            $totalInProduction += $lot['total_capacity'];

            if (($lot['current_phase']['code'] ?? null) === 'DESP') {
                $upcomingDispatches[] = [
                    'lot_id' => $lot['id'],
                    'lot_name' => $lot['name'],
                    'lot_code' => $lot['code'],
                    'planned_date' => $lot['current_phase']['planned_start_date'],
                ];
            }
        }

        usort($upcomingDispatches, fn ($a, $b) => $a['planned_date'] <=> $b['planned_date']);

        return [
            'total_in_production' => $totalInProduction,
            'total_dispatched' => $this->movementRepository->totalQuantity(),
            'upcoming_dispatches' => array_slice($upcomingDispatches, 0, 5),
        ];
    }
}
