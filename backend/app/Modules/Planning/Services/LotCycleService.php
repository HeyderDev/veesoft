<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Events\LotCycleDispatchTerminated;
use App\Modules\Planning\Events\LotCycleRescheduled;
use App\Modules\Planning\Events\LotCycleStarted;
use App\Modules\Planning\Events\LotUpdated;
use App\Modules\Planning\Models\Lot;
use App\Modules\Planning\Models\LotCycle;
use App\Modules\Planning\Models\LotCyclePhase;
use App\Modules\Planning\Models\LotCycleReschedule;
use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Repositories\Contracts\LotCycleRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\LotRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ProductionPhaseRepositoryInterface;
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

            $currentStart = Carbon::parse($startedAt);

            foreach ($phasesToSchedule as $phase) {
                // Despacho no tiene fecha de fin planificada: termina cuando se registra
                // el despacho del lote (ver terminateDispatch()), no por una duración fija.
                if ($phase->code === 'DESP') {
                    LotCyclePhase::create([
                        'lot_cycle_id' => $lotCycle->id,
                        'phase_id' => $phase->id,
                        'planned_start_date' => $currentStart->toDateString(),
                        'planned_end_date' => null,
                    ]);
                    break;
                }

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
        event(new LotCycleStarted($cycle));
        event(new LotUpdated($lot->id));

        return $this->lotCycleRepository->findWithPhases($cycle->id);
    }

    public function terminateDispatch(int $lotId)
    {
        $lot = $this->lotRepository->find($lotId);
        $cycle = $this->lotCycleRepository->findActiveForLot($lotId);

        if (! $cycle) {
            throw new \DomainException('Este lote no tiene un ciclo en curso.');
        }

        DB::transaction(function () use ($lot, $cycle) {
            $this->lotCycleRepository->update($cycle->id, ['status' => LotCycle::STATUS_DISPATCHED]);
            $this->lotRepository->update($lot->id, ['current_status' => Lot::STATUS_AVAILABLE]);
        });
        event(new LotCycleDispatchTerminated($cycle));
        event(new LotUpdated($lot->id));

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
        event(new LotCycleRescheduled($cycle));

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

            // Despacho no tiene fecha de fin planificada — ver startCycle().
            if ($catalogPhase?->code === 'DESP') {
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
            $notEnded = $phase->planned_end_date === null || $today->lte($phase->planned_end_date);

            if ($started && $notEnded) {
                return $phase;
            }
        }

        return $today->lt($phases->first()->planned_start_date) ? $phases->first() : $phases->last();
    }
}
