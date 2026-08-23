<?php

use App\Modules\Planning\Controllers\LotController;
use App\Modules\Planning\Controllers\LotCycleController;
use App\Modules\Planning\Controllers\ProductionGoalController;
use App\Modules\Planning\Controllers\ProductionPhaseController;
use App\Modules\Planning\Controllers\SummaryController;
use App\Modules\Planning\Controllers\ViveroController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Planning Module Routes
|--------------------------------------------------------------------------
| Montadas por routes/api.php bajo el prefijo global /api/v1.
| Ningún otro módulo debe declarar rutas para estos recursos.
*/

// Viveros — fuera del middleware vivero.scope: estas rutas definen o reciben
// el vivero explícitamente (no dependen de un vivero "activo" ya elegido).
Route::get('viveros/{vivero}/summary', [SummaryController::class, 'show']);
Route::apiResource('viveros', ViveroController::class);

Route::middleware('vivero.scope')->group(function () {
    // Metas de producción
    Route::post('production-goals/{production_goal}/culminar', [ProductionGoalController::class, 'culminar']);
    Route::apiResource('production-goals', ProductionGoalController::class);

    // Lotes
    Route::patch('lots/{lot}/capacity', [LotController::class, 'updateCapacity']);
    Route::patch('lots/{lot}/status', [LotController::class, 'updateStatus']);
    Route::patch('lots/{lot}/position', [LotController::class, 'updatePosition']);
    Route::apiResource('lots', LotController::class);

    // Ciclo productivo del lote (Comenzar Ciclo / Terminar Despacho)
    Route::post('lots/{lot}/cycles', [LotCycleController::class, 'store']);
    Route::post('lots/{lot}/cycles/current/terminate-dispatch', [LotCycleController::class, 'terminateDispatch']);
    Route::post('lots/{lot}/cycles/current/reschedule', [LotCycleController::class, 'reschedule']);

    // Fases del sistema
    Route::apiResource('production-phases', ProductionPhaseController::class);
});
