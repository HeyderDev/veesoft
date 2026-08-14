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

Route::middleware(['auth:sanctum', 'can:planning.view'])->group(function () {
    Route::get('viveros/{vivero}/summary', [SummaryController::class, 'show']);
    Route::apiResource('viveros', ViveroController::class)->except('destroy');
    Route::delete('viveros/{vivero}', [ViveroController::class, 'destroy'])
        ->middleware('can:planning.delete');

    Route::post('production-goals/{production_goal}/culminar', [ProductionGoalController::class, 'culminar'])
        ->middleware('can:planning.update');
    Route::apiResource('production-goals', ProductionGoalController::class)->except('destroy');
    Route::delete('production-goals/{production_goal}', [ProductionGoalController::class, 'destroy'])
        ->middleware('can:planning.delete');

    Route::patch('lots/{lot}/capacity', [LotController::class, 'updateCapacity']);
    Route::patch('lots/{lot}/status', [LotController::class, 'updateStatus']);
    Route::patch('lots/{lot}/position', [LotController::class, 'updatePosition']);
    Route::apiResource('lots', LotController::class)->except('destroy');
    Route::delete('lots/{lot}', [LotController::class, 'destroy'])
        ->middleware('can:planning.delete');

    Route::post('lots/{lot}/cycles', [LotCycleController::class, 'store']);
    Route::post('lots/{lot}/cycles/current/terminate-dispatch', [LotCycleController::class, 'terminateDispatch'])
        ->middleware('can:planning.update');
    Route::post('lots/{lot}/cycles/current/reschedule', [LotCycleController::class, 'reschedule']);

    Route::apiResource('production-phases', ProductionPhaseController::class)->except('destroy');
    Route::delete('production-phases/{production_phase}', [ProductionPhaseController::class, 'destroy'])
        ->middleware('can:planning.delete');
});
