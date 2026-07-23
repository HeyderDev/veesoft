<?php

namespace App\Modules\Planning\Controllers;

use App\Modules\Planning\Requests\CreateViveroRequest;
use App\Modules\Planning\Requests\UpdateViveroRequest;
use App\Modules\Planning\Services\ViveroService;
use App\Modules\Shared\Controllers\BaseApiController;

class ViveroController extends BaseApiController
{
    public function __construct(private ViveroService $viveroService) {}

    public function index()
    {
        $viveros = $this->viveroService->list();

        return $this->paginatedResponse($viveros, 'Viveros obtenidos');
    }

    public function store(CreateViveroRequest $request)
    {
        $vivero = $this->viveroService->create($request->validated());

        return $this->createdResponse($this->viveroService->getDetail($vivero->id));
    }

    public function show(int $vivero)
    {
        return $this->successResponse($this->viveroService->getDetail($vivero));
    }

    public function update(UpdateViveroRequest $request, int $vivero)
    {
        $this->viveroService->update($vivero, $request->validated());

        return $this->successResponse($this->viveroService->getDetail($vivero), 'Vivero actualizado');
    }

    public function destroy(int $vivero)
    {
        $this->viveroService->delete($vivero);

        return $this->noContentResponse();
    }
}
