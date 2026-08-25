<?php

namespace App\Modules\Tracking\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Tracking\Services\TrackingSummaryService;

class TrackingSummaryController extends BaseApiController
{
    public function __construct(private TrackingSummaryService $summaryService) {}

    public function general()
    {
        return $this->successResponse($this->summaryService->getGeneralSummary());
    }

    public function forLot(int $lot)
    {
        return $this->successResponse($this->summaryService->getLotSummary($lot));
    }

    public function production()
    {
        return $this->successResponse($this->summaryService->getProductionSummary());
    }
}
