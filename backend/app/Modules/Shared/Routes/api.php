<?php

use App\Modules\Shared\Controllers\AuthController;
use App\Modules\Shared\Controllers\HealthController;
use App\Modules\Shared\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Shared Module Routes
|--------------------------------------------------------------------------
| Recursos transversales: salud del sistema y sesión de usuario autenticado.
*/

Route::get('/health', [HealthController::class, 'check'])->name('health');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest')->name('auth.login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
});
