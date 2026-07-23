<?php

namespace App\Modules\Planning\Controllers;

use App\Modules\Planning\Requests\CreateLotRequest;
use App\Modules\Planning\Requests\UpdateLotCapacityRequest;
use App\Modules\Planning\Requests\UpdateLotPositionRequest;
use App\Modules\Planning\Requests\UpdateLotRequest;
use App\Modules\Planning\Requests\UpdateLotStatusRequest;
use App\Modules\Planning\Services\LotCycleService;
use App\Modules\Planning\Services\LotService;
use App\Modules\Shared\Controllers\BaseApiController;

class LotController extends BaseApiController
{
    public function __construct(
        private LotService $lotService,
        private LotCycleService $lotCycleService,
    ) {}

    private function withCurrentPhase($lot)
    {
        if ($lot->activeCycle) {
            $lot->activeCycle->setAttribute('current_phase', $this->lotCycleService->computeCurrentPhase($lot->activeCycle));
        }

        return $lot;
    }

    public function index()
    {
        $lots = $this->lotService->list();
        $lots->getCollection()->each(fn ($lot) => $this->withCurrentPhase($lot));

        return $this->paginatedResponse($lots, 'Lotes obtenidos');
    }

    public function store(CreateLotRequest $request)
    {
        $lot = $this->lotService->create($request->validated());

        return $this->createdResponse($lot);
    }

    public function show(int $lot)
    {
        return $this->successResponse($this->withCurrentPhase($this->lotService->getDetail($lot)));
    }

    public function update(UpdateLotRequest $request, int $lot)
    {
        $updated = $this->lotService->update($lot, $request->validated());

        return $this->successResponse($updated, 'Lote actualizado');
    }

    public function destroy(int $lot)
    {
        $this->lotService->delete($lot);

        return $this->noContentResponse();
    }

    public function updateCapacity(UpdateLotCapacityRequest $request, int $lot)
    {
        $updated = $this->lotService->updateCapacity($lot, (int) $request->validated('total_capacity'));

        return $this->successResponse($updated, 'Capacidad del lote actualizada');
    }

    public function updateStatus(UpdateLotStatusRequest $request, int $lot)
    {
        $updated = $this->lotService->updateStatus($lot, $request->validated('current_status'));

        return $this->successResponse($updated, 'Estado del lote actualizado');
    }

    public function updatePosition(UpdateLotPositionRequest $request, int $lot)
    {
        $updated = $this->lotService->updatePosition(
            $lot,
            (float) $request->validated('position_x'),
            (float) $request->validated('position_y'),
        );

        return $this->successResponse($updated, 'Posición del lote actualizada');
    }
}
