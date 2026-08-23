<?php

use App\Modules\Logistics\Controllers\PurchaseOrderController;
use App\Modules\Logistics\Controllers\PurchaseRequestController;
use App\Modules\Logistics\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Logistics Module Routes
|--------------------------------------------------------------------------
| Montadas por routes/api.php bajo el prefijo global /api/v1.
| Ningún otro módulo debe declarar rutas para estos recursos.
*/

Route::middleware('vivero.scope')->group(function () {
    // Proveedores
    Route::post('suppliers/{supplier}/evaluate', [SupplierController::class, 'evaluate']);
    Route::get('suppliers/{supplier}/purchase-orders', [SupplierController::class, 'purchaseHistory']);
    Route::apiResource('suppliers', SupplierController::class);

    // Solicitudes de aprovisionamiento
    Route::post('purchase-requests/{purchase_request}/review', [PurchaseRequestController::class, 'review']);
    Route::apiResource('purchase-requests', PurchaseRequestController::class)->only(['index', 'store', 'show']);

    // Órdenes de compra
    Route::get('purchase-orders/pending-deliveries', [PurchaseOrderController::class, 'pendingDeliveries']);
    Route::get('purchase-orders/next-number', [PurchaseOrderController::class, 'nextNumber']);
    Route::post('purchase-orders/{purchase_order}/receive', [PurchaseOrderController::class, 'receive']);
    Route::apiResource('purchase-orders', PurchaseOrderController::class)->only(['index', 'store', 'show']);
});
