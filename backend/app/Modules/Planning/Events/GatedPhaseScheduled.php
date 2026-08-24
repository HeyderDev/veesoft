<?php

namespace App\Modules\Planning\Events;

use App\Modules\Planning\Models\LotCyclePhase;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Disparado cada vez que se crea una fase gateada nueva (Siembra/Injertación/
 * Despacho — ver GatedPhaseCatalog) sin actividad asociada todavía: al arrancar
 * un ciclo (LotCycleService::startCycle()) y también cada vez que se genera
 * perezosamente el siguiente tramo del calendario al cerrarse el gate anterior
 * (LotCycleService::markGateSatisfied() -> scheduleBlockFrom()). Siempre
 * disparado DESPUÉS de confirmado el commit, con `$phase` recargada (phase +
 * lotCycle.lot cargados).
 *
 * Planning no puede depender de Tasks (ver docs/03_MODULE_CONTRACTS/Planning.md
 * §6) — este evento es la dirección permitida: Tasks escucha y crea la
 * actividad obligatoria correspondiente (ver
 * Tasks\Listeners\CreateTaskForGatedPhase).
 */
class GatedPhaseScheduled
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly LotCyclePhase $phase) {}
}
