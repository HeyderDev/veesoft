<?php

use App\Modules\Inventory\Controllers\MovementController;
use App\Modules\Inventory\Controllers\SupplyController;
use App\Modules\Inventory\Controllers\ToolController;
use App\Modules\Inventory\Controllers\PrintController;
use App\Modules\Inventory\Controllers\ToolUnitController;
use App\Modules\Inventory\Controllers\StudentController;
use App\Modules\Inventory\Controllers\CareerController;
use App\Modules\Inventory\Services\InventoryQueryService;
use Illuminate\Support\Facades\Route;

Route::middleware('vivero.scope')->group(function () {
    Route::get('careers', [CareerController::class, 'index']);

    Route::post('students/import', [StudentController::class, 'importCsv']);
    Route::patch('students/{student}/status', [StudentController::class, 'updateStatus']);
    Route::apiResource('students', StudentController::class);

    Route::post('tools/print-label', [PrintController::class, 'printLabel']);
    Route::apiResource('tools', ToolController::class);
    Route::post('tools/{tool}/units', [ToolUnitController::class, 'store']);

    Route::get('tool-units/{unit}', [ToolUnitController::class, 'show']);
    Route::get('tool-units/code/{code}', [ToolUnitController::class, 'findByCode']);
    Route::patch('tool-units/{unit}/status', [ToolUnitController::class, 'updateStatus']);
    Route::delete('tool-units/{unit}', [ToolUnitController::class, 'destroy']);

    Route::apiResource('supplies', SupplyController::class);
    Route::get('supplies/code/{code}', [SupplyController::class, 'findByCode']);
    Route::post('supplies/{supply}/movements', [SupplyController::class, 'registerMovement']);

    Route::get('movements', [MovementController::class, 'index']);

    // Endpoint público de consulta: herramientas e insumos disponibles
    Route::get('inventory/available-resources', function (InventoryQueryService $service) {
        return response()->json([
            'status' => 'success',
            'data' => $service->getAvailableResources(),
        ]);
    });
});
