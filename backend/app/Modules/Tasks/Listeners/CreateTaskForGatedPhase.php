<?php

namespace App\Modules\Tasks\Listeners;

use App\Modules\Planning\Events\GatedPhaseScheduled;
use App\Modules\Shared\Support\GatedPhaseCatalog;
use App\Modules\Tasks\Models\ActivityType;
use App\Modules\Tasks\Models\OperationalTask;
use App\Modules\Tasks\Services\ActivityTypeService;
use App\Modules\Tasks\Services\OperationalTaskService;
use Illuminate\Support\Carbon;

/**
 * Crea la OperationalTask obligatoria de una fase gateada (Siembra/Injerto/
 * Despacho) al iniciar un ciclo — las 3 existen desde el día uno (el
 * calendario completo se calcula de una sola vez, ver
 * LotCycleService::startCycle()), así que las 3 tareas se crean juntas.
 * Registrado explícitamente en AppServiceProvider::boot(), no por
 * autodiscovery.
 */
class CreateTaskForGatedPhase
{
    public function __construct(
        private ActivityTypeService $activityTypeService,
        private OperationalTaskService $operationalTaskService,
    ) {}

    public function handle(GatedPhaseScheduled $event): void
    {
        $phase = $event->phase;
        $viveroId = $phase->lotCycle->lot->vivero_id;

        // Defensivo: ViveroService::create() hoy solo siembra production_phases,
        // no activity_types (ver auditoría de Fase 5) — esto cubre tanto viveros
        // nuevos como los que corrieron el backfill antes de que existiera este
        // listener.
        $this->activityTypeService->seedSystemDefaultsForVivero($viveroId);

        $systemCode = GatedPhaseCatalog::activityCodeFor($phase->phase->code);

        if (! $systemCode) {
            return;
        }

        $activityType = ActivityType::where('vivero_id', $viveroId)
            ->where('system_code', $systemCode)
            ->first();

        if (! $activityType) {
            return;
        }

        // Idempotencia defensiva: si por algún motivo el listener corriera dos
        // veces para la misma fase, no duplicar la tarea.
        if (OperationalTask::where('lot_cycle_phase_id', $phase->id)->exists()) {
            return;
        }

        // Clamp: OperationalTaskService::createTask() rechaza fechas planificadas
        // en el pasado — un started_at retroactivo dejaría la fecha planeada de
        // la fase también en el pasado.
        $plannedDate = Carbon::parse($phase->planned_start_date)->max(Carbon::today());

        // title/description/priority/resources se completan solos desde la
        // plantilla en OperationalTaskService::createTask().
        $this->operationalTaskService->createTaskForPhase($phase->id, [
            'vivero_id' => $viveroId,
            'activity_type_id' => $activityType->id,
            'planned_date' => $plannedDate->toDateString(),
        ]);
    }
}
