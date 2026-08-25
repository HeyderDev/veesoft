<?php

namespace App\Modules\Logistics\Controllers;

use App\Modules\Logistics\Requests\CreateSupplierRequest;
use App\Modules\Logistics\Requests\EvaluateSupplierRequest;
use App\Modules\Logistics\Requests\UpdateSupplierRequest;
use App\Modules\Logistics\Requests\UpdateSupplierCatalogRequest;
use App\Modules\Logistics\Services\PurchaseOrderService;
use App\Modules\Logistics\Services\SupplierService;
use App\Modules\Shared\Controllers\BaseApiController;

class SupplierController extends BaseApiController
{
    public function __construct(
        private SupplierService $supplierService,
        private PurchaseOrderService $purchaseOrderService,
    ) {}

    public function index()
    {
        $suppliers = $this->supplierService->list();

        return $this->paginatedResponse($suppliers, 'Proveedores obtenidos');
    }

    public function store(CreateSupplierRequest $request)
    {
        $supplier = $this->supplierService->create($request->validated());

        return $this->createdResponse($supplier, 'Proveedor registrado exitosamente');
    }

    public function show(int $supplier)
    {
        return $this->successResponse($this->supplierService->getDetail($supplier));
    }

    public function update(UpdateSupplierRequest $request, int $supplier)
    {
        $updated = $this->supplierService->update($supplier, $request->validated());

        return $this->successResponse($updated, 'Proveedor actualizado');
    }

    public function destroy(int $supplier)
    {
        $this->supplierService->delete($supplier);

        return $this->noContentResponse();
    }

    public function evaluate(EvaluateSupplierRequest $request, int $supplier)
    {
        $data = $request->validated();
        $data['evaluated_by'] = $request->user()?->id;

        $updated = $this->supplierService->evaluate($supplier, $data);

        return $this->successResponse($updated, 'Evaluación registrada y score recalculado');
    }

    public function purchaseHistory(int $supplier)
    {
        $orders = $this->purchaseOrderService->listForSupplier($supplier);

        return $this->paginatedResponse($orders, 'Historial de compras obtenido');
    }

    public function catalog(int $supplier)
    {
        return $this->successResponse($this->supplierService->catalog($supplier));
    }

    public function updateCatalog(UpdateSupplierCatalogRequest $request, int $supplier)
    {
        return $this->successResponse(
            $this->supplierService->syncCatalog($supplier, $request->validated('items')),
            'Catálogo del proveedor actualizado'
        );
    }

    public function certificateAlerts()
    {
        return $this->successResponse($this->supplierService->certificateAlerts(), 'Alertas de certificados obtenidas');
    }

    public function spendSummary()
    {
        return $this->successResponse($this->supplierService->spendSummary(), 'Reporte de proveedores obtenido');
    }
}
