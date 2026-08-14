<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - ERP Lastenia
|--------------------------------------------------------------------------
| Prefix: /api/v1 (configurado en bootstrap/app.php)
|
| Este archivo NO define rutas directamente. Cada módulo declara las
| suyas en app/Modules/{Module}/Routes/api.php y aquí solo se incluyen.
|
| Al crear un nuevo módulo, agrega su archivo de rutas a esta lista.
*/

Route::group([], base_path('app/Modules/Shared/Routes/api.php'));
Route::group([], base_path('app/Modules/Planning/Routes/api.php'));
Route::group([], base_path('app/Modules/Tracking/Routes/api.php'));

Route::group([], base_path('app/Modules/Inventory/Routes/api.php'));
Route::group([], base_path('app/Modules/Logistics/Routes/api.php'));
Route::group([], base_path('app/Modules/Tasks/Routes/api.php'));
Route::group([], base_path('app/Modules/Synchronization/Routes/api.php'));
