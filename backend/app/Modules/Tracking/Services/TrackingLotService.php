<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Planning\Models\Lot;
use App\Modules\Planning\Services\LotCycleService;
use App\Modules\Tracking\Models\TrackingMovement;
use App\Modules\Tracking\Repositories\Contracts\TrackingLotRepositoryInterface;
use App\Modules\Tracking\Repositories\Contracts\TrackingMovementRepositoryInterface;

class TrackingLotService
{
    public function __construct(
        private TrackingLotRepositoryInterface $lotRepository,
        private TrackingMovementRepositoryInterface $movementRepository,
        private LotCycleService $lotCycleService,
    ) {}

    /**
     * Lotes con la fase actual de su ciclo activo anidada (nombre, color, fechas)
     * — alimenta tanto la etiqueta de fase junto a "Ocupado" como el indicador de
     * "listo para despachar" en la vista de tarjetas de Seguimiento.
     *
     * @return array<int, array<string, mixed>>
     */
    public function list(): array
    {
        return $this->lotRepository->allWithVivero()
            ->map(fn (Lot $lot) => array_merge($lot->toArray(), [
                'current_phase' => $this->currentPhaseData($lot),
            ]))
            ->all();
    }

    private function currentPhaseData(Lot $lot): ?array
    {
        if (! $lot->activeCycle) {
            return null;
        }

        $phase = $this->lotCycleService->computeCurrentPhase($lot->activeCycle);

        if (! $phase) {
            return null;
        }

        return [
            'code' => $phase->phase->code,
            'name' => $phase->phase->name,
            'color_reference' => $phase->phase->color_reference,
            'planned_start_date' => $phase->planned_start_date,
            'planned_end_date' => $phase->planned_end_date,
            'gate_completed_at' => $phase->gate_completed_at,
        ];
    }

    /**
     * Lote (de Planning) + su historial de movimientos de salida + la capacidad
     * disponible del ciclo activo (como un saldo: baja con cada salida
     * registrada) — es lo que se muestra al "entrar" a un lote desde la vista
     * de tarjetas, y lo que alimenta el indicador de saldo al registrar una
     * salida nueva.
     */
    public function getDetail(int $lotId): array
    {
        $lot = $this->lotRepository->find($lotId);
        $cycle = $lot->activeCycle;
        $dispatched = $cycle ? (int) TrackingMovement::where('lot_cycle_id', $cycle->id)->sum('quantity') : 0;

        return [
            'lot' => $lot,
            'movements' => $this->movementRepository->paginateWithFilters($lotId, perPage: 50),
            'capacity' => [
                'total_capacity' => $lot->total_capacity,
                'dispatched' => $dispatched,
                'remaining' => max(0, $lot->total_capacity - $dispatched),
            ],
        ];
    }
}
