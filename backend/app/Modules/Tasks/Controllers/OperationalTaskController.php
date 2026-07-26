<?php

namespace App\Modules\Tasks\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Tasks\Requests\CreateOperationalTaskRequest;
use App\Modules\Tasks\Requests\UpdateOperationalTaskRequest;
use App\Modules\Tasks\Services\OperationalTaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OperationalTaskController extends BaseApiController
{
    public function __construct(
        protected OperationalTaskService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);
        $tasks = $this->service->paginate($perPage);

        return $this->paginatedResponse($tasks, 'Tareas operativas recuperadas con éxito');
    }

    public function store(CreateOperationalTaskRequest $request): JsonResponse
    {
        $task = $this->service->createTask($request->validated());

        return $this->createdResponse($task, 'Tarea operativa creada con éxito');
    }

    public function show(int $id): JsonResponse
    {
        $task = $this->service->findById($id);

        return $this->successResponse($task, 'Tarea operativa recuperada con éxito');
    }

    public function update(UpdateOperationalTaskRequest $request, int $id): JsonResponse
    {
        $task = $this->service->updateTask($id, $request->validated());

        return $this->successResponse($task, 'Tarea operativa actualizada con éxito');
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return $this->noContentResponse();
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'completed_by' => 'required|exists:users,id',
        ]);

        $this->service->completeTask($id, $validated['completed_by']);

        return $this->successResponse(null, 'Tarea completada con éxito');
    }

    public function byLot(int $lotId): JsonResponse
    {
        $tasks = $this->service->getTasksByLot($lotId);

        return $this->successResponse($tasks, "Tareas del lote {$lotId} recuperadas con éxito");
    }

    public function history(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'type']);
        $tasks = $this->service->getHistory($filters);

        return $this->successResponse($tasks, 'Historial de tareas recuperado con éxito');
    }

    public function report(): JsonResponse
    {
        $data = $this->service->getReport();

        return $this->successResponse($data, 'Reporte de tareas generado con éxito');
    }
}
