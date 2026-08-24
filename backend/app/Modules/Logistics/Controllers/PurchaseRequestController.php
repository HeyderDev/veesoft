<?php

namespace App\Modules\Logistics\Controllers;

use App\Modules\Logistics\Requests\CreatePurchaseRequestRequest;
use App\Modules\Logistics\Requests\ReviewPurchaseRequestRequest;
use App\Modules\Logistics\Services\PurchaseRequestService;
use App\Modules\Shared\Controllers\BaseApiController;

class PurchaseRequestController extends BaseApiController
{
    public function __construct(private PurchaseRequestService $purchaseRequestService) {}

    public function index(\Illuminate\Http\Request $request)
    {
        $requests = $this->purchaseRequestService->list($request->user());

        return $this->paginatedResponse($requests, 'Solicitudes de aprovisionamiento obtenidas');
    }

    public function store(CreatePurchaseRequestRequest $request)
    {
        $data = $request->validated();

        $purchaseRequest = $this->purchaseRequestService->createPurchaseRequest(
            $data['items'],
            $data['reason'],
            $request->user()?->id,
        );

        return $this->createdResponse($purchaseRequest, 'Solicitud de aprovisionamiento registrada');
    }

    public function show(\Illuminate\Http\Request $request, int $purchaseRequest)
    {
        return $this->successResponse($this->purchaseRequestService->getDetail($purchaseRequest, $request->user()));
    }

    public function review(ReviewPurchaseRequestRequest $request, int $purchaseRequest)
    {
        $data = $request->validated();

        $updated = $this->purchaseRequestService->review(
            $purchaseRequest,
            $data['decision'],
            $request->user()?->id,
            $data,
        );

        return $this->successResponse($updated, 'Solicitud revisada');
    }
}
