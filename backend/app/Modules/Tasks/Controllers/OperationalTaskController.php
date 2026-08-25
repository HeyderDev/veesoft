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
        $filters = $request->only(['search', 'status', 'scope', 'goal_id']);
        $tasks = $this->service->paginate($filters, $perPage);

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

    public function dispatchPreview(int $id): JsonResponse
    {
        $data = $this->service->getDispatchPreview($id);

        return $this->successResponse($data, 'Previsualización de despacho recuperada con éxito');
    }

    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate(['goal_id' => 'nullable|integer']);
        $data = $this->service->getSummary(isset($validated['goal_id']) ? (int) $validated['goal_id'] : null);

        return $this->successResponse($data, 'Resumen de actividades recuperado con éxito');
    }

    public function calendar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'goal_id' => 'nullable|integer',
        ]);

        $data = $this->service->getCalendar(
            (int) $validated['year'],
            (int) $validated['month'],
            isset($validated['goal_id']) ? (int) $validated['goal_id'] : null,
        );

        return $this->successResponse($data, 'Calendario de actividades recuperado con éxito');
    }

    public function goals(): JsonResponse
    {
        return $this->successResponse($this->service->getGoalsForSelector(), 'Metas recuperadas con éxito');
    }

    public function reportQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
            'day' => 'nullable|integer|min:1|max:31',
        ]);

        $data = $this->service->getReportQuery(
            (int) $validated['year'],
            isset($validated['month']) ? (int) $validated['month'] : null,
            isset($validated['day']) ? (int) $validated['day'] : null,
        );

        return $this->successResponse($data, 'Reporte de actividades generado con éxito');
    }
}
