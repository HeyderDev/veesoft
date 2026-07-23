<?php

use App\Modules\Tracking\Controllers\DispatchReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tracking Module Routes
|--------------------------------------------------------------------------
| Montadas por routes/api.php bajo el prefijo global /api/v1.
*/

Route::get('tracking/dispatch-summary', [DispatchReportController::class, 'show']);
Route::get('tracking/pending-dispatches', [DispatchReportController::class, 'pending']);
Route::post('tracking/dispatch-reports', [DispatchReportController::class, 'store']);
