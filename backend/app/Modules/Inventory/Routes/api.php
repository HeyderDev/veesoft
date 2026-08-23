<?php

use App\Modules\Inventory\Controllers\MovementController;
use App\Modules\Inventory\Controllers\SupplyController;
use App\Modules\Inventory\Controllers\ToolController;
use App\Modules\Inventory\Services\InventoryQueryService;
use Illuminate\Support\Facades\Route;

Route::middleware('vivero.scope')->group(function () {
    Route::apiResource('tools', ToolController::class);
    Route::get('tools/code/{code}', [ToolController::class, 'findByCode']);
    Route::patch('tools/{tool}/status', [ToolController::class, 'updateStatus']);

    Route::apiResource('supplies', SupplyController::class);

    Route::get('movements', [MovementController::class, 'index']);

    // Endpoint público de consulta: herramientas e insumos disponibles
    Route::get('inventory/available-resources', function (InventoryQueryService $service) {
        return response()->json([
            'status' => 'success',
            'data' => $service->getAvailableResources(),
        ]);
    });
});
