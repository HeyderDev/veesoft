<?php

namespace App\Modules\Tracking\Repositories\Contracts;

use App\Modules\Planning\Models\Lot;
use Illuminate\Support\Collection;

/**
 * Tracking no posee los lotes (son de Planning) — esta interfaz solo lee, nunca
 * crea/edita/elimina. Mismo patrón que ya usa DispatchReportRepository para
 * leer `LotCycle`/`Dispatch` de Planning directamente.
 */
interface TrackingLotRepositoryInterface
{
    /**
     * Todos los lotes existentes, para la vista de tarjetas — no se pagina porque
     * no se espera un volumen que lo justifique todavía. Con $goalId, solo los
     * lotes que tienen (o tuvieron) un ciclo bajo esa meta.
     *
     * @return Collection<int, Lot>
     */
    public function allWithVivero(?int $goalId = null): Collection;

    public function find(int $id): Lot;
}
