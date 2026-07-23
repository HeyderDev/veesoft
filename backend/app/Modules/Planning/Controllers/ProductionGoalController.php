<?php

namespace App\Modules\Planning\Controllers;

use App\Modules\Planning\Requests\CreateProductionGoalRequest;
use App\Modules\Planning\Requests\UpdateProductionGoalRequest;
use App\Modules\Planning\Services\ProductionGoalService;
use App\Modules\Shared\Controllers\BaseApiController;

class ProductionGoalController extends BaseApiController
{
    public function __construct(private ProductionGoalService $goalService) {}

    public function index()
    {
        $goals = $this->goalService->list();

        return $this->paginatedResponse($goals, 'Metas de producción obtenidas');
    }

    public function store(CreateProductionGoalRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()?->id;

        $goal = $this->goalService->create($data);

        return $this->createdResponse($goal);
    }

    public function show(int $productionGoal)
    {
        return $this->successResponse($this->goalService->getDetail($productionGoal));
    }

    public function update(UpdateProductionGoalRequest $request, int $productionGoal)
    {
        $goal = $this->goalService->update($productionGoal, $request->validated());

        return $this->successResponse($goal, 'Meta actualizada');
    }

    public function destroy(int $productionGoal)
    {
        $this->goalService->delete($productionGoal);

        return $this->noContentResponse();
    }

    public function culminar(int $productionGoal)
    {
        $goal = $this->goalService->culminar($productionGoal);

        return $this->successResponse($goal, 'Meta culminada');
    }
}
