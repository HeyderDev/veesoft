<?php

namespace App\Modules\Planning\Events;

use App\Modules\Planning\Models\LotCyclePhase;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Disparado por cada fase gateada (Siembra/Injertación/Despacho — ver
 * GatedPhaseCatalog) sin actividad asociada todavía, al arrancar un ciclo
 * (LotCycleService::startCycle() -> notifyOpenGates()): como el calendario
 * completo se calcula de una sola vez, las 3 existen desde el día uno y
 * disparan este evento juntas. Siempre disparado DESPUÉS de confirmado el
 * commit, con `$phase` recargada (phase + lotCycle.lot cargados).
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
