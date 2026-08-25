<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Planning\Models\Dispatch;
use App\Modules\Planning\Models\LotCycle;
use App\Modules\Planning\Services\LotCycleService;
use App\Modules\Planning\Services\ProductionGoalService;
use App\Modules\Tracking\Models\TrackingMovement;
use App\Modules\Tracking\Repositories\Contracts\DispatchReportRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DispatchReportService
{
    public function __construct(
        private DispatchReportRepositoryInterface $repository,
        private ProductionGoalService $goalService,
        private LotCycleService $lotCycleService,
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
     * Registra a mano cuánto se despachó para un ciclo ya cerrado — respaldo
     * manual para cerrar ciclos viejos que hayan quedado despachados sin
     * reporte antes de Fase 6. El camino normal desde Fase 6 es
     * closeDispatchFromMovements(), disparado al completar la actividad de
     * Despacho.
     */
    public function createReport(int $lotCycleId, int $quantity, ?string $dispatchedAt = null): Dispatch
    {
        $cycle = $this->repository->findPendingCycle($lotCycleId);

        if (! $cycle) {
            throw new \DomainException('Este ciclo no existe, no está cerrado, o ya tiene un despacho reportado.');
        }

        if ($quantity < 1 || $quantity > $cycle->lot->total_capacity) {
            throw new \DomainException("La cantidad despachada debe estar entre 1 y {$cycle->lot->total_capacity} (capacidad del lote).");
        }

        return $this->recordDispatch($cycle, $quantity, $dispatchedAt);
    }

    /**
     * Cuánto se despachó según los movimientos de salida ya registrados en
     * Seguimiento para el ciclo de esta fase — para el paso 1 de la doble
     * confirmación al completar la actividad de Despacho (ver
     * Tasks\Services\OperationalTaskService::getDispatchPreview()).
     */
    public function previewFromMovements(int $lotCycleId): array
    {
        $cycle = LotCycle::with('lot')->findOrFail($lotCycleId);
        $quantity = (int) TrackingMovement::where('lot_cycle_id', $lotCycleId)->sum('quantity');

        return ['lot_name' => $cycle->lot->name, 'quantity' => $quantity];
    }

    /**
     * El camino normal desde Fase 6: al completar la actividad de Despacho, se
     * suma lo ya registrado en Seguimiento para ese ciclo (nunca un valor
     * mandado por el cliente — siempre se recalcula acá), se crea el
     * `Dispatch` con esa cantidad como dato REAL, y se cierra el ciclo
     * liberando el lote — todo en una sola transacción. Llamado desde
     * Tasks\Services\OperationalTaskService::completeTask().
     */
    public function closeDispatchFromMovements(int $lotCycleId): Dispatch
    {
        $cycle = LotCycle::with('lot')->findOrFail($lotCycleId);

        if ($cycle->dispatch()->exists()) {
            throw new \DomainException('Este ciclo ya tiene un despacho reportado.');
        }

        $quantity = (int) TrackingMovement::where('lot_cycle_id', $lotCycleId)->sum('quantity');

        return DB::transaction(function () use ($cycle, $quantity) {
            $dispatch = $this->recordDispatch($cycle, $quantity);
            $this->lotCycleService->closeCycleAfterDispatch($cycle->id);

            return $dispatch;
        });
    }

    private function recordDispatch(LotCycle $cycle, int $quantity, ?string $dispatchedAt = null): Dispatch
    {
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
