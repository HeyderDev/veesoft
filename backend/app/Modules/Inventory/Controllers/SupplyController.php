<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Requests\CreateSupplyRequest;
use App\Modules\Inventory\Requests\UpdateSupplyRequest;
use App\Modules\Inventory\Services\SupplyService;
use App\Modules\Shared\Controllers\BaseApiController;
use Illuminate\Http\Request;

class SupplyController extends BaseApiController
{
    public function __construct(
        private SupplyService $supplyService
    ) {}

    public function index(Request $request)
    {
        $search = $request->query('q');
        $supplies = $this->supplyService->list(15, $search);

        return $this->paginatedResponse($supplies, 'Insumos obtenidos');
    }

    public function store(CreateSupplyRequest $request)
    {
        $supply = $this->supplyService->create($request->validated());

        return $this->createdResponse($supply);
    }

    public function show(int $supply)
    {
        return $this->successResponse($this->supplyService->getDetail($supply));
    }

    public function update(UpdateSupplyRequest $request, int $supply)
    {
        $updated = $this->supplyService->update($supply, $request->validated());

        return $this->successResponse($updated, 'Insumo actualizado');
    }

    public function destroy(int $supply)
    {
        $this->supplyService->delete($supply);

        return $this->noContentResponse();
    }
}
