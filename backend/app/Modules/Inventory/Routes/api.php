<?php

use App\Modules\Inventory\Controllers\MovementController;
use App\Modules\Inventory\Controllers\SupplyController;
use App\Modules\Inventory\Controllers\ToolController;
use App\Modules\Inventory\Controllers\PrintController;
use App\Modules\Inventory\Controllers\ToolUnitController;
use App\Modules\Inventory\Controllers\StudentController;
use App\Modules\Inventory\Services\InventoryQueryService;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'vivero.scope'])->group(function () {
    // Admin y Operario: lectura del catálogo (dashboard, escaneo) y las acciones de escaneo en sí.
    Route::apiResource('tools', ToolController::class)->only(['index', 'show']);
    Route::apiResource('supplies', SupplyController::class)->only(['index', 'show']);
    Route::apiResource('students', StudentController::class)->only(['index', 'show']);
    Route::get('students/search/{cedula}', [StudentController::class, 'searchByCedula']);

    Route::get('tool-units/{unit}', [ToolUnitController::class, 'show']);
    Route::get('tool-units/code/{code}', [ToolUnitController::class, 'findByCode']);
    Route::patch('tool-units/{unit}/status', [ToolUnitController::class, 'updateStatus']);

    Route::get('supplies/code/{code}', [SupplyController::class, 'findByCode']);
    Route::post('supplies/{supply}/movements', [SupplyController::class, 'registerMovement']);

    Route::get('movements', [MovementController::class, 'index']);

    Route::get('inventory/available-resources', function (InventoryQueryService $service) {
        return response()->json([
            'status' => 'success',
            'data' => $service->getAvailableResources(),
        ]);
    });

    // Solo Admin: catálogo (crear/editar/borrar herramientas e insumos, imprimir etiquetas).
    Route::middleware('role:Admin')->group(function () {
        Route::post('tools/print-label', [PrintController::class, 'printLabel']);
        Route::apiResource('tools', ToolController::class)->except(['index', 'show']);
        Route::post('tools/{tool}/units', [ToolUnitController::class, 'store']);
        Route::delete('tool-units/{unit}', [ToolUnitController::class, 'destroy']);

        Route::apiResource('supplies', SupplyController::class)->except(['index', 'show']);
        Route::post('students/import', [StudentController::class, 'importCsv']);
        Route::apiResource('students', StudentController::class)->except(['index', 'show']);
    });
});
