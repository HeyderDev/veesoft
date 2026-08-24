<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Events\GatedPhaseScheduled;
use App\Modules\Planning\Models\Lot;
use App\Modules\Planning\Models\LotCycle;
use App\Modules\Planning\Models\LotCyclePhase;
use App\Modules\Planning\Models\LotCycleReschedule;
use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Repositories\Contracts\LotCycleRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\LotRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ProductionPhaseRepositoryInterface;
use App\Modules\Shared\Support\GatedPhaseCatalog;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Orquesta el ciclo de vida productivo de un lote: Comenzar Ciclo calcula el
 * calendario completo según la configuración de duraciones vigente DEL VIVERO al que
 * pertenece el lote (production_phases.estimated_duration_days — no existe
 * personalización por lote dentro de un mismo vivero, ver ProductionPhaseService);
 * Terminar Despacho cierra el ciclo y libera el lote para uno nuevo — no registra
 * cuánto se despachó. La cantidad real se reporta después, de forma independiente,
 * desde el módulo Tracking (ver DispatchReportService::createReport()), que es quien
 * crea el registro en `dispatches` y dispara la culminación de la meta si corresponde.
 */
class LotCycleService
{
    public function __construct(
        private LotRepositoryInterface $lotRepository,
        private LotCycleRepositoryInterface $lotCycleRepository,
        private ProductionPhaseRepositoryInterface $phaseRepository,
        private ProductionGoalService $goalService,
    ) {}

    /**
     * @param  int|null  $startingPhaseId  Fase por la que arranca el calendario (por
     *                                     defecto, la primera del catálogo). Permite
     *                                     comenzar un lote ya preparado directamente
     *                                     en, por ejemplo, Siembra.
     */
    public function startCycle(int $lotId, string $startedAt, ?int $startingPhaseId = null)
    {
        $lot = $this->lotRepository->find($lotId);

        if ($lot->current_status !== Lot::STATUS_AVAILABLE) {
            throw new \DomainException('Solo se puede comenzar un ciclo en un lote disponible.');
        }

        $goal = $this->goalService->findOpenForVivero($lot->vivero_id);

        if (! $goal) {
            throw new \DomainException('Este vivero no tiene una meta en curso. Crea una meta antes de comenzar un ciclo.');
        }

        if ($goal->status === ProductionGoal::STATUS_COMPLETED) {
            throw new \DomainException('Esta meta ya alcanzó su objetivo. Culmínala para poder comenzar un nuevo ciclo.');
        }

        $allPhases = $this->phaseRepository->allOrderedByExecutionForVivero($lot->vivero_id);

        if ($allPhases->isEmpty()) {
            throw new \DomainException('No hay fases configuradas para este vivero. Contacta al administrador.');
        }

        $startIndex = $startingPhaseId
            ? $allPhases->search(fn ($phase) => $phase->id === $startingPhaseId)
            : 0;

        if ($startIndex === false) {
            throw new \DomainException('La fase inicial indicada no existe.');
        }

        $phasesToSchedule = $allPhases->slice($startIndex)->values();

        $cycle = DB::transaction(function () use ($lot, $goal, $startedAt, $phasesToSchedule) {
            $lotCycle = LotCycle::create([
                'lot_id' => $lot->id,
                'production_goal_id' => $goal->id,
                'started_at' => $startedAt,
                'status' => LotCycle::STATUS_IN_PROGRESS,
            ]);

            // Genera solo el tramo conocido del calendario: desde el arranque hasta la
            // primera fase gateada (Siembra/Injertación/Despacho) inclusive — ver
            // scheduleBlockFrom(). El resto se genera solo cuando esa fase se completa.
            $this->scheduleBlockFrom($lotCycle, $phasesToSchedule, 0, Carbon::parse($startedAt));

            $this->lotRepository->update($lot->id, ['current_status' => Lot::STATUS_OCCUPIED]);

            return $lotCycle;
        });

        $this->goalService->activateIfNotStarted($goal->id);

        // Recargado (no la instancia devuelta dentro de la transacción) para tener
        // phases.phase cargada y garantía de commit antes de que Tasks reaccione.
        $cycleWithPhases = $this->lotCycleRepository->findWithPhases($cycle->id);

        $this->notifyOpenGate($cycleWithPhases);

        return $cycleWithPhases;
    }

    public function terminateDispatch(int $lotId)
    {
        $lot = $this->lotRepository->find($lotId);
        $cycle = $this->lotCycleRepository->findActiveForLot($lotId);

        if (! $cycle) {
            throw new \DomainException('Este lote no tiene un ciclo en curso.');
        }

        $cycleWithPhases = $this->lotCycleRepository->findWithPhases($cycle->id);
        $dispatchPhase = $cycleWithPhases->phases->first(fn ($phase) => $phase->phase->code === 'DESP');

        if ($dispatchPhase && GatedPhaseCatalog::isGated($dispatchPhase->phase->code) && $dispatchPhase->gate_completed_at === null) {
            throw new \DomainException('No puedes terminar el despacho: la actividad obligatoria de Despacho todavía no está completada.');
        }

        DB::transaction(function () use ($lot, $cycle) {
            $this->lotCycleRepository->update($cycle->id, ['status' => LotCycle::STATUS_DISPATCHED]);
            $this->lotRepository->update($lot->id, ['current_status' => Lot::STATUS_AVAILABLE]);
        });

        return $this->lotRepository->findWithCycles($lot->id);
    }

    /**
     * Reprograma el paso de la fase actual a la siguiente: recalcula la fecha de
     * transición (adelanto o atraso) y desplaza en cascada todas las fases
     * posteriores respetando las duraciones globales vigentes. Las fases ya
     * transcurridas no se tocan. Queda un registro histórico en lot_cycle_reschedules.
     */
    public function reschedule(int $lotId, string $transitionDate, ?int $rescheduledBy = null)
    {
        $lot = $this->lotRepository->find($lotId);
        $cycle = $this->lotCycleRepository->findActiveForLot($lotId);

        if (! $cycle) {
            throw new \DomainException('Este lote no tiene un ciclo en curso.');
        }

        $cycle = $this->lotCycleRepository->findWithPhases($cycle->id);
        $currentPhase = $this->computeCurrentPhase($cycle);

        if (! $currentPhase) {
            throw new \DomainException('Este ciclo no tiene fases configuradas.');
        }

        // Las fases gateadas (Siembra/Injertación/Despacho) no tienen una fecha de
        // transición fija que reprogramar a mano: son indefinidas desde que arrancan
        // (planned_end_date siempre null, igual que Despacho) y avanzan solas apenas
        // se completa su actividad obligatoria — ver markGateSatisfied().
        if (GatedPhaseCatalog::isGated($currentPhase->phase->code)) {
            throw new \DomainException("La fase {$currentPhase->phase->name} avanza automáticamente al completarse su actividad obligatoria — no se puede reprogramar manualmente.");
        }

        $orderedPhases = $cycle->phases()->orderBy('planned_start_date')->get();
        $currentIndex = $orderedPhases->search(fn ($phase) => $phase->id === $currentPhase->id);

        if ($currentIndex === false || $currentIndex >= $orderedPhases->count() - 1) {
            throw new \DomainException('No hay una fase siguiente a la cual pasar. Usa Terminar Despacho para cerrar este ciclo.');
        }

        $nextPhase = $orderedPhases[$currentIndex + 1];
        $newTransitionDate = Carbon::parse($transitionDate);

        if ($newTransitionDate->lt(Carbon::parse($currentPhase->planned_start_date))) {
            throw new \DomainException('La fecha de transición no puede ser anterior al inicio de la fase actual.');
        }

        $previousTransitionDate = $currentPhase->planned_end_date;
        $durationsByPhaseId = $this->phaseRepository->allOrderedByExecutionForVivero($lot->vivero_id)->keyBy('id');

        DB::transaction(function () use ($orderedPhases, $currentIndex, $newTransitionDate, $currentPhase, $nextPhase, $cycle, $previousTransitionDate, $rescheduledBy, $durationsByPhaseId) {
            $currentPhase->update(['planned_end_date' => $newTransitionDate->toDateString()]);

            $this->cascadeFrom($orderedPhases, $currentIndex + 1, $newTransitionDate->copy()->addDay(), $durationsByPhaseId);

            LotCycleReschedule::create([
                'lot_cycle_id' => $cycle->id,
                'from_phase_id' => $currentPhase->phase_id,
                'to_phase_id' => $nextPhase->phase_id,
                'previous_transition_date' => $previousTransitionDate,
                'new_transition_date' => $newTransitionDate->toDateString(),
                'rescheduled_by' => $rescheduledBy,
            ]);
        });

        return $this->lotCycleRepository->findWithPhases($cycle->id);
    }

    /**
     * Se invoca cuando cambia la duración de una fase de un vivero
     * (ProductionPhaseService::update). Recalcula el calendario de TODOS los lotes DE
     * ESE VIVERO con un ciclo en curso, pero solo desde la fase en la que cada uno se
     * encuentra actualmente en adelante — las fases ya transcurridas de cada lote no
     * se tocan, evitando el desfase de "reprogramar" el pasado.
     */
    public function resyncActiveCyclesForPhaseChange(int $viveroId): void
    {
        $durationsByPhaseId = $this->phaseRepository->allOrderedByExecutionForVivero($viveroId)->keyBy('id');
        $activeCycles = $this->lotCycleRepository->allActiveWithPhasesForVivero($viveroId);

        foreach ($activeCycles as $cycle) {
            $currentPhase = $this->computeCurrentPhase($cycle);

            if (! $currentPhase) {
                continue;
            }

            $orderedPhases = $cycle->phases->sortBy('planned_start_date')->values();
            $currentIndex = $orderedPhases->search(fn ($phase) => $phase->id === $currentPhase->id);

            if ($currentIndex === false) {
                continue;
            }

            $anchorStart = Carbon::parse($currentPhase->planned_start_date);
            $this->cascadeFrom($orderedPhases, $currentIndex, $anchorStart, $durationsByPhaseId);
        }
    }

    /**
     * Recalcula fechas de forma secuencial a partir de `$fromIndex`, anclando el
     * inicio de esa fase en `$anchorStart` y encadenando las siguientes con la
     * duración global vigente de cada una. Usado tanto por reschedule() (ancla en
     * una fecha de transición elegida a mano) como por resyncActiveCyclesForPhaseChange()
     * (ancla en la fecha de inicio ya fija de la fase actual).
     */
    private function cascadeFrom(Collection $orderedPhases, int $fromIndex, Carbon $anchorStart, Collection $durationsByPhaseId): void
    {
        $cursor = $anchorStart;

        for ($i = $fromIndex; $i < $orderedPhases->count(); $i++) {
            $phase = $orderedPhases[$i];
            $catalogPhase = $durationsByPhaseId[$phase->phase_id] ?? null;

            // Fases gateadas (Siembra/Injertación/Despacho) no tienen fecha de fin
            // planificada — son indefinidas hasta que se completa su actividad — ver
            // scheduleBlockFrom(). No se sigue cascadeando más allá: las fases
            // siguientes a una gateada no existen todavía (se crean recién cuando esa
            // gateada se cierra, ver markGateSatisfied()).
            if ($catalogPhase && GatedPhaseCatalog::isGated($catalogPhase->code)) {
                $phase->update([
                    'planned_start_date' => $cursor->toDateString(),
                    'planned_end_date' => null,
                ]);
                break;
            }

            $durationDays = $catalogPhase->estimated_duration_days ?? 1;
            $end = $cursor->copy()->addDays(max(0, $durationDays - 1));

            $phase->update([
                'planned_start_date' => $cursor->toDateString(),
                'planned_end_date' => $end->toDateString(),
            ]);

            $cursor = $end->copy()->addDay();
        }
    }

    /**
     * Determina la fase "actual" comparando hoy contra el calendario calculado —
     * nunca se guarda como estado manual (ver docs/03_MODULE_CONTRACTS/Planning.md).
     * Despacho no tiene `planned_end_date` (ver startCycle()): una vez alcanzada,
     * permanece "actual" indefinidamente hasta que se registre el despacho.
     *
     * Fases gateadas (Siembra/Injertación/Despacho, ver GatedPhaseCatalog): si ya
     * empezaron pero su actividad obligatoria no está completada (`gate_completed_at`
     * NULL), quedan "congeladas" como actual aunque ya haya pasado `planned_end_date`
     * — el sistema deja de avanzar solo por fecha hasta que Tasks confirme el gate
     * (ver OperationalTaskService::completeTask() -> markGateSatisfied()).
     *
     * Usa la relación `phases` YA CARGADA en `$cycle` (todos los llamadores eager-cargan
     * `phases.phase`, ver LotRepository/LotCycleRepository) en vez de volver a
     * consultarla con `$cycle->phases()->get()` — esa consulta fresca no arrastra la
     * relación `phase` anidada, y el resultado terminaba serializándose sin ella
     * (`current_phase.phase` faltante en la respuesta JSON).
     */
    public function computeCurrentPhase(LotCycle $cycle): ?LotCyclePhase
    {
        $phases = $cycle->phases->sortBy('planned_start_date')->values();

        if ($phases->isEmpty()) {
            return null;
        }

        $today = Carbon::today();

        foreach ($phases as $phase) {
            $started = $today->gte($phase->planned_start_date);

            if (! $started) {
                break;
            }

            if (GatedPhaseCatalog::isGated($phase->phase->code) && $phase->gate_completed_at === null) {
                return $phase;
            }

            $notEnded = $phase->planned_end_date === null || $today->lte($phase->planned_end_date);

            if ($notEnded) {
                return $phase;
            }
        }

        return $today->lt($phases->first()->planned_start_date) ? $phases->first() : $phases->last();
    }

    /**
     * Marca satisfecha la actividad obligatoria de una fase gateada (llamado desde
     * Tasks\Services\OperationalTaskService::completeTask() — dirección Tasks ->
     * Planning permitida, ver docs/03_MODULE_CONTRACTS/Planning.md). Siembra,
     * Injertación y Despacho son indefinidas desde que arrancan (planned_end_date
     * siempre null, ver scheduleBlockFrom()) — no hay nada que "extender", solo
     * cerrar esta fase y generar recién ahora el siguiente tramo del calendario,
     * que hasta este momento no existía porque su fecha de inicio dependía de
     * cuándo se completara esta actividad.
     */
    public function markGateSatisfied(int $lotCyclePhaseId, Carbon $completedAt, ?int $userId = null): void
    {
        $phase = LotCyclePhase::with(['phase', 'lotCycle.lot', 'lotCycle.phases.phase'])->findOrFail($lotCyclePhaseId);

        if ($phase->gate_completed_at !== null) {
            return;
        }

        $cycleId = $phase->lot_cycle_id;

        // La fase gateada no puede "cerrar" antes de haber empezado — si se
        // confirma la actividad antes de la fecha en que la fase arrancó (p. ej.
        // por error, o completando una tarea futura fuera de orden), la fase
        // siguiente se ancla igual en planned_start_date, nunca antes, para que
        // el calendario nunca quede con fechas superpuestas o invertidas.
        $anchorDate = $completedAt->copy()->max(Carbon::parse($phase->planned_start_date));

        DB::transaction(function () use ($phase, $completedAt, $anchorDate, $userId) {
            $phase->update(['gate_completed_at' => $completedAt]);

            $cycle = $phase->lotCycle;
            $viveroId = $cycle->lot->vivero_id;
            $catalogPhases = $this->phaseRepository->allOrderedByExecutionForVivero($viveroId);
            $catalogIndex = $catalogPhases->search(fn ($p) => $p->id === $phase->phase_id);

            if ($catalogIndex === false) {
                return;
            }

            $created = $this->scheduleBlockFrom($cycle, $catalogPhases, $catalogIndex + 1, $anchorDate->copy()->addDay());

            if ($created->isEmpty()) {
                return; // era la última fase del catálogo (p. ej. Despacho) — nada que generar.
            }

            LotCycleReschedule::create([
                'lot_cycle_id' => $cycle->id,
                'from_phase_id' => $phase->phase_id,
                'to_phase_id' => $created->first()->phase_id,
                'previous_transition_date' => $phase->planned_start_date,
                'new_transition_date' => $anchorDate->toDateString(),
                'rescheduled_by' => $userId,
            ]);
        });

        // Fuera de la transacción, con el ciclo recargado (mismo motivo que
        // startCycle()): si el bloque generado incluyó una fase gateada nueva,
        // avisa a Tasks para que le cree su actividad obligatoria.
        $this->notifyOpenGate($this->lotCycleRepository->findWithPhases($cycleId));
    }

    /**
     * Si el ciclo tiene una fase gateada (Siembra/Injertación/Despacho) recién
     * creada y sin actividad asociada todavía (`gate_completed_at` null), avisa a
     * Tasks para que le cree la tarea obligatoria correspondiente — ver
     * GatedPhaseScheduled. Por construcción, un ciclo tiene como máximo una fase
     * gateada abierta a la vez (scheduleBlockFrom() siempre se detiene justo
     * después de crear una).
     */
    private function notifyOpenGate(LotCycle $cycle): void
    {
        $openGate = $cycle->phases->first(
            fn ($phase) => GatedPhaseCatalog::isGated($phase->phase->code) && $phase->gate_completed_at === null
        );

        if ($openGate) {
            event(new GatedPhaseScheduled($openGate));
        }
    }

    /**
     * Crea secuencialmente las filas de LotCyclePhase que hacen falta desde
     * $fromCatalogIndex (posición en el catálogo ordenado del vivero), anclando el
     * inicio del primer tramo en $anchorStart y encadenando los siguientes con la
     * duración vigente de cada fase. Se detiene apenas crea una fase gateada
     * (Siembra/Injertación/Despacho, inclusive) — esa fase queda con
     * planned_end_date null (indefinida) y las fases posteriores a ella no se
     * generan todavía: su fecha de inicio depende de cuándo se complete la
     * actividad de esa fase gateada (ver markGateSatisfied()). Usado tanto por
     * startCycle() (arranque del ciclo) como por markGateSatisfied() (al cerrarse
     * un gate) — ambos casos generan "el siguiente tramo conocido" del calendario.
     */
    private function scheduleBlockFrom(LotCycle $cycle, Collection $catalogPhases, int $fromCatalogIndex, Carbon $anchorStart): Collection
    {
        $created = collect();
        $cursor = $anchorStart;

        for ($i = $fromCatalogIndex; $i < $catalogPhases->count(); $i++) {
            $catalogPhase = $catalogPhases[$i];
            $isGated = GatedPhaseCatalog::isGated($catalogPhase->code);

            $lotCyclePhase = LotCyclePhase::create([
                'lot_cycle_id' => $cycle->id,
                'phase_id' => $catalogPhase->id,
                'planned_start_date' => $cursor->toDateString(),
                'planned_end_date' => $isGated
                    ? null
                    : $cursor->copy()->addDays(max(0, $catalogPhase->estimated_duration_days - 1))->toDateString(),
            ]);

            $created->push($lotCyclePhase);

            if ($isGated) {
                break;
            }

            $cursor = Carbon::parse($lotCyclePhase->planned_end_date)->addDay();
        }

        return $created;
    }
}
