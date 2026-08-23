<?php

use App\Modules\Shared\Controllers\AuthController;
use App\Modules\Shared\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Shared Module Routes
|--------------------------------------------------------------------------
| Recursos transversales: salud del sistema, sesión de usuario autenticado.
*/

Route::get('/health', [HealthController::class, 'check'])->name('health');

// Puntos de entrada — fuera de auth:sanctum a propósito.
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    Route::middleware('role:Admin')->group(function () {
        Route::get('/users', fn () => response()->json([
            'status' => 'success',
            'message' => 'Usuarios obtenidos',
            'data' => \App\Modules\Shared\Models\User::with('role')->get(),
        ]));
    });
});
