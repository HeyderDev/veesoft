<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Planning\Services\ProductionGoalService;
use App\Modules\Tracking\Repositories\Contracts\DispatchReportRepositoryInterface;
use Illuminate\Support\Collection;

class DispatchReportService
{
    public function __construct(
        private DispatchReportRepositoryInterface $repository,
        private ProductionGoalService $goalService,
    ) {}

    public function totalDispatchedForGoal(int $goalId): int
    {
        return $this->repository->totalDispatchedForGoal($goalId);
    }

    public function pendingCyclesForVivero(int $viveroId): Collection
    {
        return $this->repository->pendingCyclesForVivero($viveroId);
    }

    /**
     * Registra cuánto se despachó realmente para un ciclo ya cerrado. Es la única
     * acción que crea un `Dispatch`, y por lo tanto la única que puede completar la
     * meta de producción asociada.
     */
    public function createReport(int $lotCycleId, int $quantity, ?string $dispatchedAt = null)
    {
        $cycle = $this->repository->findPendingCycle($lotCycleId);

        if (! $cycle) {
            throw new \DomainException('Este ciclo no existe, no está cerrado, o ya tiene un despacho reportado.');
        }

        if ($quantity < 1 || $quantity > $cycle->lot->total_capacity) {
            throw new \DomainException("La cantidad despachada debe estar entre 1 y {$cycle->lot->total_capacity} (capacidad del lote).");
        }

        $dispatch = $this->repository->createReport([
            'lot_id' => $cycle->lot_id,
            'lot_cycle_id' => $cycle->id,
            'production_goal_id' => $cycle->production_goal_id,
            'quantity' => $quantity,
            'dispatched_at' => $dispatchedAt ?? now()->toDateString(),
        ]);

        $this->goalService->completeIfTargetReached($cycle->production_goal_id);

        return $dispatch;
    }
}
