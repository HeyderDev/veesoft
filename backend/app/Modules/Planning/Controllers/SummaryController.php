<?php

namespace App\Modules\Planning\Controllers;

use App\Modules\Planning\Services\SummaryService;
use App\Modules\Shared\Controllers\BaseApiController;
use Illuminate\Http\Request;

class SummaryController extends BaseApiController
{
    public function __construct(private SummaryService $summaryService) {}

    public function show(Request $request, int $vivero)
    {
        $year = $request->query('year') ? (int) $request->query('year') : null;

        return $this->successResponse($this->summaryService->getSummary($vivero, $year));
    }
}
