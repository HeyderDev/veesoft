<?php

namespace App\Modules\Logistics\Controllers;

use App\Modules\Logistics\Requests\CreatePurchaseOrderRequest;
use App\Modules\Logistics\Requests\ReceivePurchaseOrderRequest;
use App\Modules\Logistics\Services\PurchaseOrderService;
use App\Modules\Shared\Controllers\BaseApiController;

class PurchaseOrderController extends BaseApiController
{
    public function __construct(private PurchaseOrderService $purchaseOrderService) {}

    public function index()
    {
        $orders = $this->purchaseOrderService->list();

        return $this->paginatedResponse($orders, 'Órdenes de compra obtenidas');
    }

    public function nextNumber()
    {
        return $this->successResponse(
            ['order_number' => $this->purchaseOrderService->nextOrderNumber()],
            'Siguiente número de orden sugerido'
        );
    }

    public function store(CreatePurchaseOrderRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()?->id;

        $order = $this->purchaseOrderService->create($data);

        return $this->createdResponse($order, 'Orden de compra generada exitosamente');
    }

    public function show(int $purchaseOrder)
    {
        return $this->successResponse($this->purchaseOrderService->getDetail($purchaseOrder));
    }

    public function receive(ReceivePurchaseOrderRequest $request, int $purchaseOrder)
    {
        $data = $request->validated();
        $data['received_by'] = $request->user()?->id;

        $result = $this->purchaseOrderService->receive($purchaseOrder, $data);

        return $this->successResponse($result, 'Recepción registrada');
    }

    public function pendingDeliveries()
    {
        return $this->successResponse(
            $this->purchaseOrderService->pendingDeliveries(),
            'Calendario de entregas pendientes obtenido'
        );
    }
}
