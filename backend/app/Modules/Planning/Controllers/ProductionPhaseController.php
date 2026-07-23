<?php

namespace App\Modules\Planning\Controllers;

use App\Modules\Planning\Requests\CreateProductionPhaseRequest;
use App\Modules\Planning\Requests\UpdateProductionPhaseRequest;
use App\Modules\Planning\Services\ProductionPhaseService;
use App\Modules\Shared\Controllers\BaseApiController;

class ProductionPhaseController extends BaseApiController
{
    public function __construct(private ProductionPhaseService $phaseService) {}

    /**
     * Devuelve las fases de TODOS los viveros (igual que /lots devuelve todos los
     * lotes) — el frontend filtra client-side por vivero_id, ver useFasesViewModel.
     */
    public function index()
    {
        $phases = $this->phaseService->listAll();

        return $this->successResponse($phases, 'Fases de producción obtenidas');
    }

    public function store(CreateProductionPhaseRequest $request)
    {
        $phase = $this->phaseService->create($request->validated());

        return $this->createdResponse($phase);
    }

    public function show(int $productionPhase)
    {
        return $this->successResponse($this->phaseService->getById($productionPhase));
    }

    public function update(UpdateProductionPhaseRequest $request, int $productionPhase)
    {
        $phase = $this->phaseService->update($productionPhase, $request->validated());

        return $this->successResponse($phase, 'Fase actualizada');
    }

    public function destroy(int $productionPhase)
    {
        $this->phaseService->delete($productionPhase);

        return $this->noContentResponse();
    }
}
