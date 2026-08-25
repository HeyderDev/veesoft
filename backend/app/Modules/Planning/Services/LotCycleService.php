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
 * calendario completo de las 6 fases según la configuración de duraciones
 * vigente DEL VIVERO al que pertenece el lote (production_phases.
 * estimated_duration_days — no existe personalización por lote dentro de un
 * mismo vivero, ver ProductionPhaseService), incluidas Siembra/Injertación/
 * Despacho (arrancan con 1 día por defecto, ver GatedPhaseCatalog). Si la
 * actividad obligatoria de una de esas 3 fases se demora, esa fase se
 * "congela" como actual más allá de su fecha planeada, y al confirmarse se
 * extiende hasta la fecha real y las fases siguientes se recalculan en
 * cascada — ver computeCurrentPhase() y markGateSatisfied(). closeCycleAfterDispatch()
 * cierra el ciclo y libera el lote para uno nuevo; el camino normal desde Fase 6 es
 * automático — al completar la actividad de Despacho (ver
 * Tasks\Services\OperationalTaskService::completeTask()), Tracking\DispatchReportService::
 * closeDispatchFromMovements() suma lo ya registrado en Seguimiento para ese ciclo, crea
 * el `Dispatch`, llama a este método y dispara la culminación de la meta si corresponde.
 * "Terminar Despacho" (terminateDispatch(), manual) y "Reportar Despacho" (createReport(),
 * manual) siguen existiendo solo como respaldo para cerrar a mano ciclos viejos que hayan
 * quedado despachados sin reporte antes de Fase 6.
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

            $currentStart = Carbon::parse($startedAt);

            // Todas las fases se calculan de una — incluidas Siembra/Injertación/
            // Despacho, con su duración por defecto (1 día, ver GatedPhaseCatalog):
            // si su actividad se demora, se extienden y las posteriores se
            // recalculan en cascada (ver markGateSatisfied()), pero el calendario
            // siempre muestra un cálculo completo desde el día uno.
            foreach ($phasesToSchedule as $phase) {
                $currentEnd = $currentStart->copy()->addDays(max(0, $phase->estimated_duration_days - 1));

                LotCyclePhase::create([
                    'lot_cycle_id' => $lotCycle->id,
                    'phase_id' => $phase->id,
                    'planned_start_date' => $currentStart->toDateString(),
                    'planned_end_date' => $currentEnd->toDateString(),
                ]);

                $currentStart = $currentEnd->copy()->addDay();
            }

            $this->lotRepository->update($lot->id, ['current_status' => Lot::STATUS_OCCUPIED]);

            return $lotCycle;
        });

        $this->goalService->activateIfNotStarted($goal->id);

        // Recargado (no la instancia devuelta dentro de la transacción) para tener
        // phases.phase cargada y garantía de commit antes de que Tasks reaccione.
        $cycleWithPhases = $this->lotCycleRepository->findWithPhases($cycle->id);

        $this->notifyOpenGates($cycleWithPhases);

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

        if ($dispatchPhase && $dispatchPhase->gate_completed_at === null) {
            throw new \DomainException('No puedes terminar el despacho: la actividad obligatoria de Despacho todavía no está completada.');
        }

        $this->closeCycleAfterDispatch($cycle->id);

        return $this->lotRepository->findWithCycles($lot->id);
    }

    /**
     * Cierra el ciclo y libera el lote para uno nuevo — el mismo paso que hace
     * "Terminar Despacho" a mano, ahora también reusado por
     * Tracking\DispatchReportService::closeDispatchFromMovements() cuando se
     * completa la actividad de Despacho (ver
     * Tasks\Services\OperationalTaskService::completeTask()), que es el camino
     * normal desde esta fase en adelante.
     */
    public function closeCycleAfterDispatch(int $lotCycleId): void
    {
        $cycle = $this->lotCycleRepository->find($lotCycleId);

        DB::transaction(function () use ($cycle) {
            $this->lotCycleRepository->update($cycle->id, ['status' => LotCycle::STATUS_DISPATCHED]);
            $this->lotRepository->update($cycle->lot_id, ['current_status' => Lot::STATUS_AVAILABLE]);
        });
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

        // Las fases gateadas (Siembra/Injertación/Despacho) solo avanzan al
        // confirmarse su actividad obligatoria (ver markGateSatisfied()) — no se
        // pueden reprogramar a mano, aunque tengan una fecha planeada como
        // cualquier otra fase.
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
     * duración global vigente de cada una — tratando cada fase por igual
     * (incluidas Siembra/Injertación/Despacho, cuya duración vigente por defecto
     * es 1 día). Usado por reschedule() (ancla en una fecha de transición elegida
     * a mano), resyncActiveCyclesForPhaseChange() (ancla en la fecha de inicio ya
     * fija de la fase actual) y markGateSatisfied() (ancla en la fecha real de
     * confirmación de una actividad obligatoria que se demoró).
     */
    private function cascadeFrom(Collection $orderedPhases, int $fromIndex, Carbon $anchorStart, Collection $durationsByPhaseId): void
    {
        $cursor = $anchorStart;

        for ($i = $fromIndex; $i < $orderedPhases->count(); $i++) {
            $phase = $orderedPhases[$i];
            $catalogPhase = $durationsByPhaseId[$phase->phase_id] ?? null;
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
     *
     * Fases gateadas (Siembra/Injertación/Despacho, ver GatedPhaseCatalog): si ya
     * empezaron pero su actividad obligatoria no está completada (`gate_completed_at`
     * NULL), quedan "congeladas" como actual aunque ya haya pasado su
     * `planned_end_date` calculado — el sistema deja de avanzar solo por fecha
     * hasta que Tasks confirme el gate (ver
     * OperationalTaskService::completeTask() -> markGateSatisfied()), que en ese
     * momento extiende la fecha de fin al día real de confirmación.
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
     * Planning permitida, ver docs/03_MODULE_CONTRACTS/Planning.md). Si la
     * confirmación llegó después de su `planned_end_date` calculado (por
     * defecto, 1 día), extiende esa fecha hasta el día real de confirmación y
     * recalcula en cascada las fases siguientes — ya existen todas desde
     * startCycle(), así que esto es solo un ajuste de fechas, no una creación.
     * Si se confirma a tiempo o antes, no hace falta tocar nada más.
     */
    public function markGateSatisfied(int $lotCyclePhaseId, Carbon $completedAt, ?int $userId = null): void
    {
        $phase = LotCyclePhase::with(['phase', 'lotCycle.lot', 'lotCycle.phases.phase'])->findOrFail($lotCyclePhaseId);

        if ($phase->gate_completed_at !== null) {
            return;
        }

        $wasLate = $phase->planned_end_date !== null && $completedAt->toDateString() > $phase->planned_end_date->toDateString();
        $previousEndDate = $phase->planned_end_date;

        DB::transaction(function () use ($phase, $completedAt, $wasLate, $previousEndDate, $userId) {
            $phase->update(['gate_completed_at' => $completedAt]);

            if (! $wasLate) {
                return;
            }

            $cycle = $phase->lotCycle;
            $orderedPhases = $cycle->phases->sortBy('planned_start_date')->values();
            $index = $orderedPhases->search(fn ($p) => $p->id === $phase->id);

            if ($index === false) {
                return;
            }

            $phase->update(['planned_end_date' => $completedAt->toDateString()]);

            $durationsByPhaseId = $this->phaseRepository
                ->allOrderedByExecutionForVivero($cycle->lot->vivero_id)
                ->keyBy('id');

            $this->cascadeFrom($orderedPhases, $index + 1, $completedAt->copy()->addDay(), $durationsByPhaseId);

            $nextPhase = $orderedPhases->get($index + 1);

            if ($nextPhase) {
                LotCycleReschedule::create([
                    'lot_cycle_id' => $cycle->id,
                    'from_phase_id' => $phase->phase_id,
                    'to_phase_id' => $nextPhase->phase_id,
                    'previous_transition_date' => $previousEndDate,
                    'new_transition_date' => $completedAt->toDateString(),
                    'rescheduled_by' => $userId,
                ]);
            }
        });
    }

    /**
     * Avisa a Tasks (vía evento, dirección permitida) de cada fase gateada sin
     * actividad todavía en el ciclo recién creado — con el calendario completo
     * generado de una sola vez en startCycle(), las 3 (Siembra/Injertación/
     * Despacho) ya existen desde el día uno, así que las 3 tareas obligatorias
     * se crean juntas al iniciar el ciclo, no una por una a medida que se llega
     * a cada fase.
     */
    private function notifyOpenGates(LotCycle $cycle): void
    {
        $cycle->phases
            ->filter(fn ($phase) => GatedPhaseCatalog::isGated($phase->phase->code) && $phase->gate_completed_at === null)
            ->each(fn ($phase) => event(new GatedPhaseScheduled($phase)));
    }
}
