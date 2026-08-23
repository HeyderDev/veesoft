<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Requests\UpdateToolStatusRequest;
use App\Modules\Inventory\Services\ToolUnitService;
use App\Modules\Shared\Controllers\BaseApiController;
use Illuminate\Http\Request;

class ToolUnitController extends BaseApiController
{
    public function __construct(
        private ToolUnitService $toolUnitService
    ) {}

    public function store(int $toolId)
    {
        return $this->successResponse($this->toolUnitService->createUnitForTool($toolId), 'Unidad añadida exitosamente', 201);
    }

    public function show(int $unit)
    {
        return $this->successResponse($this->toolUnitService->getDetail($unit));
    }

    public function findByCode(string $code)
    {
        return $this->successResponse($this->toolUnitService->findByCode($code));
    }

    public function updateStatus(UpdateToolStatusRequest $request, int $unit)
    {
        $updated = $this->toolUnitService->updateStatus($unit, $request->validated('status'), $request->validated('details'));

        return $this->successResponse($updated, 'Estado de la unidad actualizado');
    }

    public function destroy(Request $request, int $unit)
    {
        $this->toolUnitService->deleteUnit($unit, $request->input('motivo'));
        return $this->successResponse(null, 'Unidad eliminada exitosamente');
    }
}
