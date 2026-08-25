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
        // ?role=Operario (opcional) — ej. para listar solo operarios en el
        // selector de "Asignado a" al crear/editar una actividad en Tasks.
        Route::get('/users', function (\Illuminate\Http\Request $request) {
            $query = \App\Modules\Shared\Models\User::with('role');

            if ($request->filled('role')) {
                $query->whereHas('role', fn ($q) => $q->where('name', $request->string('role')));
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Usuarios obtenidos',
                'data' => $query->get(),
            ]);
        });
    });
});
