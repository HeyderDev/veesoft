<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Models\Lot;
use App\Modules\Planning\Repositories\Contracts\LotRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ProductionGoalRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ProductionPhaseRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\SummaryRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ViveroRepositoryInterface;

/**
 * Agrega datos de varias entidades de Planning (Vivero, ProductionGoal, Lot,
 * ProductionPhase, Dispatch) para alimentar la página "Resumen" (Paso 4): no posee
 * su propia tabla, por eso no extiende BaseService.
 */
class SummaryService
{
    public function __construct(
        private ViveroRepositoryInterface $viveroRepository,
        private ProductionGoalRepositoryInterface $goalRepository,
        private LotRepositoryInterface $lotRepository,
        private ProductionPhaseRepositoryInterface $phaseRepository,
        private SummaryRepositoryInterface $summaryRepository,
        private LotCycleService $lotCycleService,
    ) {}

    public function getSummary(int $viveroId, ?int $year = null): array
    {
        $year ??= (int) now()->year;

        $vivero = $this->viveroRepository->find($viveroId);
        $goal = $this->goalRepository->findOpenForVivero($viveroId);
        $lots = $this->lotRepository->allForVivero($viveroId);
        $phases = $this->phaseRepository->allOrderedByExecutionForVivero($viveroId);

        $capacityByPhase = [];

        foreach ($lots as $lot) {
            if (! $lot->activeCycle) {
                continue;
            }

            $currentPhase = $this->lotCycleService->computeCurrentPhase($lot->activeCycle);

            if (! $currentPhase) {
                continue;
            }

            $capacityByPhase[$currentPhase->phase_id] = ($capacityByPhase[$currentPhase->phase_id] ?? 0) + $lot->total_capacity;
        }

        $phaseDistribution = $phases->map(fn ($phase) => [
            'phase_id' => $phase->id,
            'code' => $phase->code,
            'name' => $phase->name,
            'color_reference' => $phase->color_reference,
            'capacity' => $capacityByPhase[$phase->id] ?? 0,
        ])->values();

        // "En producción" = desde Siembra en adelante (excluye Preparación, que todavía
        // no tiene semilla sembrada).
        $sowingPhase = $phases->firstWhere('code', 'SIEM');
        $productionCapacity = $sowingPhase
            ? $phases->filter(fn ($phase) => $phase->execution_order >= $sowingPhase->execution_order)
                ->sum(fn ($phase) => $capacityByPhase[$phase->id] ?? 0)
            : 0;

        return [
            'vivero' => $vivero,
            'open_goal' => $goal,
            'lot_status_counts' => [
                'available' => $lots->where('current_status', Lot::STATUS_AVAILABLE)->count(),
                'occupied' => $lots->where('current_status', Lot::STATUS_OCCUPIED)->count(),
                'inactive' => $lots->where('current_status', Lot::STATUS_INACTIVE)->count(),
            ],
            'available_capacity' => $lots->where('current_status', Lot::STATUS_AVAILABLE)->sum('total_capacity'),
            'production_capacity' => $productionCapacity,
            'phase_distribution' => $phaseDistribution,
            'projection_vs_reality' => $this->summaryRepository->projectionVsRealityForVivero($viveroId, $year),
            'year' => $year,
        ];
    }
}
