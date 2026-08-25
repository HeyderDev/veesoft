<?php

namespace App\Modules\Tasks\Services;

use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Services\LotCycleService;
use App\Modules\Planning\Services\ProductionGoalService;
use App\Modules\Shared\Services\BaseService;
use App\Modules\Shared\Support\CurrentVivero;
use App\Modules\Shared\Support\GatedPhaseCatalog;
use App\Modules\Tasks\Models\ActivityType;
use App\Modules\Tasks\Models\OperationalTask;
use App\Modules\Tasks\Models\TaskResource;
use App\Modules\Tasks\Repositories\Contracts\OperationalTaskRepositoryInterface;
use App\Modules\Tracking\Services\DispatchReportService;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class OperationalTaskService extends BaseService
{
    public function __construct(
        OperationalTaskRepositoryInterface $repository,
        private LotCycleService $lotCycleService,
        private ProductionGoalService $productionGoalService,
        private CurrentVivero $currentVivero,
        private DispatchReportService $dispatchReportService,
    ) {
        parent::__construct($repository);
    }

    public function paginate(array $filters = [], int $perPage = 15)
    {
        return $this->repository->paginateWithRelations($filters, $perPage);
    }

    public function findById(int $id)
    {
        return $this->repository->findWithRelations($id);
    }

    public function createTask(array $data): OperationalTask
    {
        $plannedDateStr = Carbon::parse($data['planned_date'])->startOfDay()->toDateString();
        $plannedDate = Carbon::parse($data['planned_date'])->startOfDay();
        if ($plannedDate->isBefore(now()->startOfDay())) {
            throw ValidationException::withMessages([
                'planned_date' => 'No se permiten actividades con fechas planificadas anteriores a hoy.',
            ]);
        }

        $viveroId = $data['vivero_id'] ?? $this->currentVivero->id();

        // Si la actividad nace de una plantilla, completa con los valores de la
        // plantilla todo lo que no haya venido explícito en el payload — así el
        // flujo "Desde Plantilla" del frontend solo necesita mandar
        // activity_type_id + fecha (+ lote/asignado). Los cambios futuros a la
        // plantilla no afectan tareas ya creadas: esto es una copia, no una
        // referencia viva.
        if (! empty($data['activity_type_id'])) {
            $activityType = ActivityType::with('resources')->find($data['activity_type_id']);

            if ($activityType) {
                if (empty($data['title'])) {
                    $data['title'] = $activityType->name;
                }
                if (empty($data['description'])) {
                    $data['description'] = $activityType->description;
                }
                if (empty($data['priority'])) {
                    $data['priority'] = $activityType->default_priority;
                }
                if (! array_key_exists('resources', $data)) {
                    $data['resources'] = $activityType->resources->map(fn ($r) => [
                        'type' => $r->resource_type,
                        'id' => $r->resource_id,
                        'quantity' => $r->quantity,
                    ])->all();
                }
            }
        }

        // Resolver lot_id al current phase id
        if (!empty($data['lot_id'])) {
            $lotId = $data['lot_id'];
            $lot = \App\Modules\Planning\Models\Lot::with('activeCycle.phases')->find($lotId);
            
            if (!$lot || !$lot->activeCycle) {
                throw ValidationException::withMessages([
                    'lot_id' => 'El lote seleccionado no tiene un ciclo activo en este momento.',
                ]);
            }
            
            $phase = $lot->activeCycle->phases()
                ->where('planned_start_date', '<=', $plannedDateStr)
                ->orderBy('planned_start_date', 'desc')
                ->first();

            if (!$phase) {
                $phase = $lot->activeCycle->phases()->orderBy('planned_start_date', 'asc')->first();
            }

            if (!$phase) {
                throw ValidationException::withMessages([
                    'lot_id' => 'No se pudo determinar la fase del ciclo para asignar la actividad.',
                ]);
            }
            $data['lot_cycle_phase_id'] = $phase->id;
        }
        unset($data['lot_id']);

        $data['status'] = 'pending';
        $data['vivero_id'] = $viveroId;
        $data['production_goal_id'] = $viveroId ? $this->productionGoalService->findOpenForVivero($viveroId)?->id : null;
        $resources = $data['resources'] ?? [];
        unset($data['resources']);

        $task = $this->repository->create($data);
        $this->syncResources($task, $resources);

        return $task->load(['resources', 'activityType', 'lotCyclePhase.lotCycle.lot']);
    }

    public function createTaskForPhase(int $cycleLotPhaseId, array $data): OperationalTask
    {
        $data['lot_cycle_phase_id'] = $cycleLotPhaseId;

        return $this->createTask($data);
    }

    public function updateTask(int $id, array $data): OperationalTask
    {
        if (array_key_exists('lot_id', $data)) {
            if (!empty($data['lot_id'])) {
                $task = $this->repository->find($id);
                $plannedDateStr = isset($data['planned_date']) 
                    ? Carbon::parse($data['planned_date'])->toDateString() 
                    : Carbon::parse($task->planned_date)->toDateString();

                $lotId = $data['lot_id'];
                $lot = \App\Modules\Planning\Models\Lot::with('activeCycle.phases')->find($lotId);
                
                if (!$lot || !$lot->activeCycle) {
                    throw ValidationException::withMessages([
                        'lot_id' => 'El lote seleccionado no tiene un ciclo activo en este momento.',
                    ]);
                }
                
                $phase = $lot->activeCycle->phases()
                    ->where('planned_start_date', '<=', $plannedDateStr)
                    ->orderBy('planned_start_date', 'desc')
                    ->first();

                if (!$phase) {
                    $phase = $lot->activeCycle->phases()->orderBy('planned_start_date', 'asc')->first();
                }

                $data['lot_cycle_phase_id'] = $phase->id;
            } else {
                $data['lot_cycle_phase_id'] = null;
            }
            unset($data['lot_id']);
        }

        $resources = $data['resources'] ?? null;
        unset($data['resources']);

        $task = $this->repository->update($id, $data);

        if ($resources !== null) {
            $this->syncResources($task, $resources);
        }

        return $task->load(['resources', 'lotCyclePhase.lotCycle.lot']);
    }

    public function completeTask(int $taskId, int $completedBy): void
    {
        $task = $this->repository->find($taskId)->load('activityType', 'lotCyclePhase');

        $this->repository->update($taskId, [
            'status' => 'completed',
            'completed_date' => now(),
            'completed_by' => $completedBy,
        ]);

        // Si esta tarea satisface una actividad obligatoria (Siembra/Injerto/
        // Despacho), avisa a Planning para que deje de congelar esa fase — ver
        // GatedPhaseCatalog y LotCycleService::markGateSatisfied().
        $systemCode = $task->activityType?->system_code;
        $phaseCode = $systemCode ? GatedPhaseCatalog::phaseCodeForActivity($systemCode) : null;

        if ($phaseCode && $task->lot_cycle_phase_id) {
            $this->lotCycleService->markGateSatisfied($task->lot_cycle_phase_id, now(), $completedBy);

            // Despacho: además de satisfacer el gate, cierra el ciclo — suma lo ya
            // registrado en Seguimiento para este ciclo (nunca un valor mandado por
            // el cliente), crea el Dispatch real y libera el lote. Ver
            // Tracking\Services\DispatchReportService::closeDispatchFromMovements().
            if ($systemCode === 'DISPATCH') {
                $this->dispatchReportService->closeDispatchFromMovements($task->lotCyclePhase->lot_cycle_id);
            }
        }
    }

    /**
     * Cuánto se despachó según los movimientos de salida ya registrados en
     * Seguimiento para el ciclo de esta tarea — para el paso 1 de la doble
     * confirmación al completar la actividad de Despacho.
     */
    public function getDispatchPreview(int $taskId): array
    {
        $task = $this->repository->find($taskId)->load('activityType', 'lotCyclePhase');

        if ($task->activityType?->system_code !== 'DISPATCH' || ! $task->lot_cycle_phase_id) {
            throw new \DomainException('Esta actividad no es la de Despacho de un lote.');
        }

        return $this->dispatchReportService->previewFromMovements($task->lotCyclePhase->lot_cycle_id);
    }

    public function getTasksByAssignee(int $userId)
    {
        return $this->repository->getTasksByAssignee($userId);
    }

    /**
     * @param  int|null  $goalId  Meta a consultar — si no viene, la meta abierta del
     *                            vivero (comportamiento de siempre). Permite ver los
     *                            números de una meta ya culminada sin perder de vista
     *                            cuál es la meta realmente abierta ahora mismo (ver
     *                            `open_goal` en la respuesta, usado para defaultear el
     *                            selector de meta en el frontend).
     */
    public function getSummary(?int $goalId = null): array
    {
        $viveroId = $this->currentVivero->id();
        $openGoal = $viveroId ? $this->productionGoalService->findOpenForVivero($viveroId) : null;
        $resolvedGoalId = $goalId !== null ? $this->resolveGoalId($goalId, $viveroId) : $openGoal?->id;

        $summary = $this->repository->getSummary($viveroId, $resolvedGoalId);
        $summary['open_goal'] = $openGoal ? ['id' => $openGoal->id, 'title' => $openGoal->title] : null;

        return $summary;
    }

    public function getCalendar(int $year, int $month, ?int $goalId = null): array
    {
        $viveroId = $this->currentVivero->id();
        $resolvedGoalId = $goalId !== null
            ? $this->resolveGoalId($goalId, $viveroId)
            : $this->productionGoalService->findOpenForVivero($viveroId)?->id;

        return $this->repository->getCalendar($viveroId, $resolvedGoalId, $year, $month);
    }

    public function getReportQuery(int $year, ?int $month, ?int $day): array
    {
        return $this->repository->getReportQuery($this->currentVivero->id(), $year, $month, $day);
    }

    /**
     * Lista liviana de metas del vivero, para el selector de meta en la
     * sección Actividades (permite ver el listado/cards/calendario de una
     * meta ya culminada, no solo la abierta).
     */
    public function getGoalsForSelector(): array
    {
        return $this->productionGoalService->listForVivero($this->currentVivero->id());
    }

    private function resolveGoalId(int $goalId, ?int $viveroId): int
    {
        ProductionGoal::where('id', $goalId)->where('vivero_id', $viveroId)->firstOrFail();

        return $goalId;
    }

    private function syncResources(OperationalTask $task, array $resources): void
    {
        // Delete existing and re-insert (simple sync)
        TaskResource::where('operational_task_id', $task->id)->delete();

        foreach ($resources as $resource) {
            if (! empty($resource['type']) && ! empty($resource['id'])) {
                TaskResource::create([
                    'operational_task_id' => $task->id,
                    'resource_type' => $resource['type'],
                    'resource_id' => $resource['id'],
                    'quantity' => $resource['quantity'] ?? 1,
                ]);
            }
        }
    }
}
