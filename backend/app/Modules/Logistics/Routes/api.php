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

Route::middleware(['auth:sanctum', 'vivero.scope'])->group(function () {
    // Solicitudes: cualquier usuario autenticado puede consultar las propias;
    // solo Operario las crea y solo Admin las revisa.
    Route::get('purchase-requests', [PurchaseRequestController::class, 'index']);
    Route::get('purchase-requests/{purchase_request}', [PurchaseRequestController::class, 'show']);
    Route::middleware('role:Operario')->post('purchase-requests', [PurchaseRequestController::class, 'store']);
    Route::middleware('role:Admin')->post('purchase-requests/{purchase_request}/review', [PurchaseRequestController::class, 'review']);

    // Órdenes: Admin y Operario pueden consultar y registrar la recepción;
    // la creación se mantiene exclusivamente en Admin.
    Route::get('purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::get('purchase-orders/pending-deliveries', [PurchaseOrderController::class, 'pendingDeliveries']);

    Route::middleware('role:Admin')->group(function () {
        // Proveedores
        Route::post('suppliers/{supplier}/evaluate', [SupplierController::class, 'evaluate']);
        Route::get('suppliers/{supplier}/purchase-orders', [SupplierController::class, 'purchaseHistory']);
        Route::get('suppliers/{supplier}/catalog', [SupplierController::class, 'catalog']);
        Route::put('suppliers/{supplier}/catalog', [SupplierController::class, 'updateCatalog']);
        Route::get('suppliers-certificates/alerts', [SupplierController::class, 'certificateAlerts']);
        Route::apiResource('suppliers', SupplierController::class);

        // Órdenes de compra
        Route::get('purchase-orders/unregistered-items', [PurchaseOrderController::class, 'unregisteredItems']);
        Route::post('purchase-orders', [PurchaseOrderController::class, 'store']);
    });

    Route::get('purchase-orders/{purchase_order}', [PurchaseOrderController::class, 'show']);
    Route::post('purchase-orders/{purchase_order}/receive', [PurchaseOrderController::class, 'receive']);
});
