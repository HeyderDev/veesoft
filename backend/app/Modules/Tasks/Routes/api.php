<?php

use App\Modules\Tasks\Controllers\OperationalTaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('tasks')->group(function () {
    // Rutas fijas primero (antes de los parámetros /{id})
    Route::get('/history', [OperationalTaskController::class, 'history']);
    Route::get('/report', [OperationalTaskController::class, 'report']);
    Route::get('/by-lot/{lotId}', [OperationalTaskController::class, 'byLot']);

    Route::get('/', [OperationalTaskController::class, 'index']);
    Route::post('/', [OperationalTaskController::class, 'store']);
    Route::get('/{id}', [OperationalTaskController::class, 'show']);
    Route::put('/{id}', [OperationalTaskController::class, 'update']);
    Route::delete('/{id}', [OperationalTaskController::class, 'destroy']);
    Route::post('/{id}/complete', [OperationalTaskController::class, 'complete']);
});
