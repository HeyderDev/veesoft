<?php

namespace App\Modules\Tracking\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Tracking\Services\TrackingLotService;

class TrackingLotController extends BaseApiController
{
    public function __construct(private TrackingLotService $lotService) {}

    public function index()
    {
        return $this->successResponse($this->lotService->list(), 'Lotes obtenidos');
    }

    public function show(int $lot)
    {
        return $this->successResponse($this->lotService->getDetail($lot));
    }
}
