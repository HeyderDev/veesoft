<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Requests\CreateToolRequest;
use App\Modules\Inventory\Requests\UpdateToolRequest;
use App\Modules\Inventory\Requests\UpdateToolStatusRequest;
use App\Modules\Inventory\Services\ToolService;
use App\Modules\Shared\Controllers\BaseApiController;
use Illuminate\Http\Request;

class ToolController extends BaseApiController
{
    public function __construct(
        private ToolService $toolService
    ) {}

    public function index(Request $request)
    {
        $search = $request->query('q');
        $tools = $this->toolService->list(15, $search);
        return $this->paginatedResponse($tools, 'Herramientas obtenidas');
    }

    public function store(CreateToolRequest $request)
    {
        $tool = $this->toolService->create($request->validated());
        return $this->createdResponse($tool);
    }

    public function show(int $tool)
    {
        return $this->successResponse($this->toolService->getDetail($tool));
    }

    public function update(UpdateToolRequest $request, int $tool)
    {
        $updated = $this->toolService->update($tool, $request->validated());
        return $this->successResponse($updated, 'Herramienta actualizada');
    }

    public function updateStatus(UpdateToolStatusRequest $request, int $tool)
    {
        $updated = $this->toolService->updateStatus($tool, $request->validated('status'), $request->validated('details'));
        return $this->successResponse($updated, 'Estado de herramienta actualizado');
    }

    public function destroy(int $tool)
    {
        $this->toolService->delete($tool);
        return $this->noContentResponse();
    }
}
