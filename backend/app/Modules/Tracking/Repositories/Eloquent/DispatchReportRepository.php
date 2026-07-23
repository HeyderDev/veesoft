<?php

namespace App\Modules\Tracking\Repositories\Eloquent;

use App\Modules\Planning\Models\Dispatch;
use App\Modules\Planning\Models\LotCycle;
use App\Modules\Tracking\Repositories\Contracts\DispatchReportRepositoryInterface;
use Illuminate\Support\Collection;

/**
 * Lee y escribe sobre el registro operativo de despachos (tabla `dispatches`,
 * propiedad del módulo Planning). Tracking es la única fuente que Resumen Operativo
 * consulta para "plántulas despachadas", y el único lugar que crea ese registro:
 * Planning solo cierra el ciclo (Terminar Despacho), nunca reporta la cantidad.
 */
class DispatchReportRepository implements DispatchReportRepositoryInterface
{
    public function totalDispatchedForGoal(int $goalId): int
    {
        return (int) Dispatch::where('production_goal_id', $goalId)->sum('quantity');
    }

    public function pendingCyclesForVivero(int $viveroId): Collection
    {
        return LotCycle::query()
            ->with('lot')
            ->where('status', LotCycle::STATUS_DISPATCHED)
            ->whereDoesntHave('dispatch')
            ->whereHas('lot', fn ($q) => $q->where('vivero_id', $viveroId))
            ->orderBy('started_at')
            ->get();
    }

    public function findPendingCycle(int $lotCycleId): ?LotCycle
    {
        return LotCycle::query()
            ->with('lot')
            ->where('status', LotCycle::STATUS_DISPATCHED)
            ->whereDoesntHave('dispatch')
            ->find($lotCycleId);
    }

    public function createReport(array $data): Dispatch
    {
        return Dispatch::create($data);
    }
}
