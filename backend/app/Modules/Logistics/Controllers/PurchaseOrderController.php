<?php

namespace App\Modules\Logistics\Controllers;

use App\Modules\Logistics\Requests\CreatePurchaseOrderRequest;
use App\Modules\Logistics\Requests\ReceivePurchaseOrderRequest;
use App\Modules\Logistics\Services\PurchaseOrderService;
use App\Modules\Shared\Controllers\BaseApiController;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PurchaseOrderController extends BaseApiController
{
    public function __construct(private PurchaseOrderService $purchaseOrderService) {}

    public function index()
    {
        $orders = $this->purchaseOrderService->list();

        return $this->paginatedResponse($orders, 'Órdenes de compra obtenidas');
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

    public function unregisteredItems()
    {
        return $this->successResponse(
            $this->purchaseOrderService->unregisteredItems(),
            'Ítems sin orden de compra registrada obtenidos'
        );
    }

    /**
     * Reporte de gasto: anual (`?year=`) o para un rango arbitrario
     * (`?start_date=&end_date=&label=`, p.ej. el período de una Meta de Producción
     * de Planning que el frontend ya resolvió — ver Logistics.md §7).
     */
    public function spendReport(Request $request)
    {
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $report = $this->purchaseOrderService->spendReport(
                Carbon::parse($request->query('start_date')),
                Carbon::parse($request->query('end_date')),
                (string) ($request->query('label') ?? 'Período seleccionado'),
            );
        } else {
            $year = (int) ($request->query('year') ?? now()->year);
            $report = $this->purchaseOrderService->annualSpendReport($year);
        }

        return $this->successResponse($report, 'Reporte de gasto obtenido');
    }
}
