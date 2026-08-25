<?php

use App\Modules\Tasks\Controllers\OperationalTaskController;
use App\Modules\Tasks\Controllers\ActivityTypeController;
use Illuminate\Support\Facades\Route;

Route::prefix('tasks')->middleware(['auth:sanctum', 'vivero.scope'])->group(function () {
    // Rutas fijas primero (antes de los parámetros /{id}).
    // Reporte histórico por período: exclusivo de Admin.
    Route::middleware('role:Admin')->group(function () {
        Route::get('/report-query', [OperationalTaskController::class, 'reportQuery']);

        Route::post('/', [OperationalTaskController::class, 'store']);
        Route::put('/{id}', [OperationalTaskController::class, 'update']);
        Route::delete('/{id}', [OperationalTaskController::class, 'destroy']);
    });

    // Admin y Operario: buscar/ver actividades (generales y por lote, ya
    // fusionadas en un solo índice), tablero de la sección Actividades y
    // marcarlas como completadas.
    Route::get('/', [OperationalTaskController::class, 'index']);
    Route::get('/summary', [OperationalTaskController::class, 'summary']);
    Route::get('/calendar', [OperationalTaskController::class, 'calendar']);
    Route::get('/goals', [OperationalTaskController::class, 'goals']);
    Route::get('/{id}', [OperationalTaskController::class, 'show']);
    Route::get('/{id}/dispatch-preview', [OperationalTaskController::class, 'dispatchPreview']);
    Route::post('/{id}/complete', [OperationalTaskController::class, 'complete']);
});

Route::prefix('activity-types')->middleware(['auth:sanctum', 'vivero.scope'])->group(function () {
    Route::get('/', [ActivityTypeController::class, 'index']);
    Route::get('/{id}', [ActivityTypeController::class, 'show']);
    
    Route::middleware('role:Admin')->group(function () {
        Route::post('/', [ActivityTypeController::class, 'store']);
        Route::put('/{id}', [ActivityTypeController::class, 'update']);
        Route::delete('/{id}', [ActivityTypeController::class, 'destroy']);
    });
});
