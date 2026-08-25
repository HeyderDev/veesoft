<?php

namespace App\Modules\Tracking\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Tracking\Services\TrackingLotService;
use Illuminate\Http\Request;

class TrackingLotController extends BaseApiController
{
    public function __construct(private TrackingLotService $lotService) {}

    public function index(Request $request)
    {
        return $this->successResponse($this->lotService->list($request->integer('goal_id') ?: null), 'Lotes obtenidos');
    }

    public function show(int $lot)
    {
        return $this->successResponse($this->lotService->getDetail($lot));
    }

    public function goals()
    {
        return $this->successResponse($this->lotService->goals(), 'Metas recuperadas con éxito');
    }
}
