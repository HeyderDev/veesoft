<?php

use App\Modules\Synchronization\Controllers\SyncReceiveController;
use Illuminate\Support\Facades\Route;

Route::post('sync/receive', SyncReceiveController::class)
    ->middleware('throttle:sync');
