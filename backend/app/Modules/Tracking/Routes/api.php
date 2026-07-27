<?php

use App\Modules\Tracking\Controllers\DispatchReportController;
use App\Modules\Tracking\Controllers\TrackingItemController;
use App\Modules\Tracking\Controllers\TrackingMovementController;
use App\Modules\Tracking\Controllers\TrackingSummaryController;
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

// ---- Seguimiento de inventario (TrackingItem / TrackingMovement) ----
Route::get('tracking/summary', [TrackingSummaryController::class, 'show']);
Route::get('tracking/summary/alerts', [TrackingSummaryController::class, 'alerts']);

Route::get('tracking/movements', [TrackingMovementController::class, 'index']);
Route::post('tracking/movements', [TrackingMovementController::class, 'store']);

Route::get('tracking/items', [TrackingItemController::class, 'index']);
Route::post('tracking/items', [TrackingItemController::class, 'store']);
Route::get('tracking/items/{trackingItem}', [TrackingItemController::class, 'show']);
Route::put('tracking/items/{trackingItem}', [TrackingItemController::class, 'update']);
Route::delete('tracking/items/{trackingItem}', [TrackingItemController::class, 'destroy']);
