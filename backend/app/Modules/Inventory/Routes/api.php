<?php

use App\Modules\Inventory\Controllers\MovementController;
use App\Modules\Inventory\Controllers\SupplyController;
use App\Modules\Inventory\Controllers\ToolController;
use Illuminate\Support\Facades\Route;

Route::apiResource('tools', ToolController::class);
Route::patch('tools/{tool}/status', [ToolController::class, 'updateStatus']);
    
Route::apiResource('supplies', SupplyController::class);
    
Route::get('movements', [MovementController::class, 'index']);
