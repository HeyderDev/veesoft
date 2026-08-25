<?php

use App\Modules\Tracking\Controllers\DispatchReportController;
use App\Modules\Tracking\Controllers\TrackingClientController;
use App\Modules\Tracking\Controllers\TrackingLotController;
use App\Modules\Tracking\Controllers\TrackingMovementController;
use App\Modules\Tracking\Controllers\TrackingSummaryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tracking Module Routes
|--------------------------------------------------------------------------
| Montadas por routes/api.php bajo el prefijo global /api/v1.
*/

Route::middleware(['auth:sanctum', 'vivero.scope'])->group(function () {
    // Admin y Operario: registrar movimientos de seguimiento y lo necesario para hacerlo.
    Route::get('tracking/lots', [TrackingLotController::class, 'index']);
    Route::get('tracking/lots/{lot}', [TrackingLotController::class, 'show']);
    Route::get('tracking/goals', [TrackingLotController::class, 'goals']);
    Route::get('tracking/production-summary', [TrackingSummaryController::class, 'production']);

    Route::get('tracking/movements', [TrackingMovementController::class, 'index']);
    Route::post('tracking/movements', [TrackingMovementController::class, 'store']);

    Route::get('tracking/clients', [TrackingClientController::class, 'index']);
    Route::get('tracking/clients/{trackingClient}', [TrackingClientController::class, 'show']);

    // Solo Admin: despachos, gestión de clientes y resúmenes.
    Route::middleware('role:Admin')->group(function () {
        Route::get('tracking/dispatch-summary', [DispatchReportController::class, 'show']);
        Route::get('tracking/pending-dispatches', [DispatchReportController::class, 'pending']);
        Route::post('tracking/dispatch-reports', [DispatchReportController::class, 'store']);

        Route::post('tracking/clients', [TrackingClientController::class, 'store']);
        Route::put('tracking/clients/{trackingClient}', [TrackingClientController::class, 'update']);
        Route::delete('tracking/clients/{trackingClient}', [TrackingClientController::class, 'destroy']);

        Route::get('tracking/summary', [TrackingSummaryController::class, 'general']);
        Route::get('tracking/summary/lots/{lot}', [TrackingSummaryController::class, 'forLot']);
    });
});
