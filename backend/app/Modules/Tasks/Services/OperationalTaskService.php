<?php

namespace App\Modules\Tasks\Services;

use App\Modules\Planning\Services\LotCycleService;
use App\Modules\Shared\Services\BaseService;
use App\Modules\Shared\Support\GatedPhaseCatalog;
use App\Modules\Tasks\Models\OperationalTask;
use App\Modules\Tasks\Models\TaskResource;
use App\Modules\Tasks\Repositories\Contracts\OperationalTaskRepositoryInterface;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class OperationalTaskService extends BaseService
{
    public function __construct(
        OperationalTaskRepositoryInterface $repository,
        private LotCycleService $lotCycleService,
    ) {
        parent::__construct($repository);
    }

    public function paginate(int $perPage = 15)
    {
        return $this->repository->paginateWithRelations($perPage);
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
        $resources = $data['resources'] ?? [];
        unset($data['resources']);

        $task = $this->repository->create($data);
        $this->syncResources($task, $resources);

        return $task->load(['resources', 'lotCyclePhase.lotCycle.lot']);
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
        $task = $this->repository->find($taskId)->load('activityType');

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
        }
    }

    public function getTasksByAssignee(int $userId)
    {
        return $this->repository->getTasksByAssignee($userId);
    }

    public function getTasksByLot(int $lotId)
    {
        return $this->repository->getTasksByLot($lotId);
    }

    public function getHistory(array $filters = [])
    {
        return $this->repository->getHistory($filters);
    }

    public function getReport(): array
    {
        return $this->repository->getReport();
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
