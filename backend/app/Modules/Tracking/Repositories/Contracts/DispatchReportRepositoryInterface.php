<?php

namespace App\Modules\Tracking\Repositories\Contracts;

use App\Modules\Planning\Models\Dispatch;
use App\Modules\Planning\Models\LotCycle;
use Illuminate\Support\Collection;

interface DispatchReportRepositoryInterface
{
    /**
     * Total real de plántulas despachadas (suma de `dispatches.quantity`) asociado
     * a una meta de producción puntual.
     */
    public function totalDispatchedForGoal(int $goalId): int;

    /**
     * Ciclos ya cerrados (Terminar Despacho dejó el lote disponible de nuevo) que
     * todavía no tienen un reporte de despacho — a la espera de que Tracking
     * registre cuánto se despachó realmente.
     *
     * @return Collection<int, LotCycle>
     */
    public function pendingCyclesForVivero(int $viveroId): Collection;

    /**
     * Un ciclo cerrado y sin reporte todavía, listo para recibir uno — o null si
     * no existe, no está cerrado, o ya fue reportado.
     */
    public function findPendingCycle(int $lotCycleId): ?LotCycle;

    public function createReport(array $data): Dispatch;
}
