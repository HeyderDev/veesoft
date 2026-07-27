<?php

namespace App\Modules\Tracking\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Tracking\Services\TrackingSummaryService;

class TrackingSummaryController extends BaseApiController
{
    public function __construct(private TrackingSummaryService $summaryService) {}

    public function show()
    {
        return $this->successResponse($this->summaryService->getSummary());
    }

    public function alerts()
    {
        return $this->successResponse($this->summaryService->getStockAlerts());
    }
}
