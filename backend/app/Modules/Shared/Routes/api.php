<?php

use App\Modules\Shared\Controllers\HealthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Shared Module Routes
|--------------------------------------------------------------------------
| Recursos transversales: salud del sistema, sesión de usuario autenticado.
| La autenticación completa (login/registro) se añade aquí a medida que
| se implemente.
*/

Route::get('/health', [HealthController::class, 'check'])->name('health');

Route::get('/users', fn () => \App\Modules\Shared\Models\User::select('id', 'name')->get());

Route::get('/user', fn (Request $request) => $request->user());
