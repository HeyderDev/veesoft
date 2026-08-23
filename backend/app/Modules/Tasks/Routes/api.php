<?php

use App\Modules\Tasks\Controllers\OperationalTaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('tasks')->middleware(['auth:sanctum', 'vivero.scope'])->group(function () {
    // Rutas fijas primero (antes de los parámetros /{id}) — todas de Admin.
    Route::middleware('role:Admin')->group(function () {
        Route::get('/history', [OperationalTaskController::class, 'history']);
        Route::get('/report', [OperationalTaskController::class, 'report']);
        Route::get('/by-lot/{lotId}', [OperationalTaskController::class, 'byLot']);

        Route::post('/', [OperationalTaskController::class, 'store']);
        Route::put('/{id}', [OperationalTaskController::class, 'update']);
        Route::delete('/{id}', [OperationalTaskController::class, 'destroy']);
    });

    // Admin y Operario: ver tareas y marcarlas como completadas.
    Route::get('/', [OperationalTaskController::class, 'index']);
    Route::get('/{id}', [OperationalTaskController::class, 'show']);
    Route::post('/{id}/complete', [OperationalTaskController::class, 'complete']);
});
