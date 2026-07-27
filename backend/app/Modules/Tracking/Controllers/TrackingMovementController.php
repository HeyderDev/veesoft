<?php

namespace App\Modules\Tracking\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Tracking\Requests\CreateTrackingMovementRequest;
use App\Modules\Tracking\Services\TrackingMovementService;
use Illuminate\Http\Request;

class TrackingMovementController extends BaseApiController
{
    public function __construct(private TrackingMovementService $movementService) {}

    public function index(Request $request)
    {
        $trackingItemId = $request->query('tracking_item_id') ? (int) $request->query('tracking_item_id') : null;

        $movements = $this->movementService->list($trackingItemId);

        return $this->paginatedResponse($movements, 'Movimientos obtenidos');
    }

    public function store(CreateTrackingMovementRequest $request)
    {
        $movement = $this->movementService->register($request->validated());

        return $this->createdResponse($movement, 'Movimiento registrado');
    }
}
