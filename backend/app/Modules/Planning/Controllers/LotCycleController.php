<?php

namespace App\Modules\Planning\Controllers;

use App\Modules\Planning\Requests\RescheduleLotCycleRequest;
use App\Modules\Planning\Requests\StartLotCycleRequest;
use App\Modules\Planning\Services\LotCycleService;
use App\Modules\Shared\Controllers\BaseApiController;

class LotCycleController extends BaseApiController
{
    public function __construct(private LotCycleService $lotCycleService) {}

    public function store(StartLotCycleRequest $request, int $lot)
    {
        $cycle = $this->lotCycleService->startCycle(
            $lot,
            $request->validated('started_at'),
            $request->validated('starting_phase_id') ? (int) $request->validated('starting_phase_id') : null,
        );

        return $this->createdResponse($cycle, 'Ciclo iniciado y calendario calculado');
    }

    public function terminateDispatch(int $lot)
    {
        $updatedLot = $this->lotCycleService->terminateDispatch($lot);

        return $this->successResponse($updatedLot, 'Ciclo cerrado — el lote vuelve a estar disponible');
    }

    public function reschedule(RescheduleLotCycleRequest $request, int $lot)
    {
        $cycle = $this->lotCycleService->reschedule(
            $lot,
            $request->validated('transition_date'),
            $request->user()?->id,
        );

        return $this->successResponse($cycle, 'Calendario reprogramado');
    }
}
