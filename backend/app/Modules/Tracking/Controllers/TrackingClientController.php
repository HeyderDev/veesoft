<?php

namespace App\Modules\Tracking\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Tracking\Requests\CreateTrackingClientRequest;
use App\Modules\Tracking\Requests\UpdateTrackingClientRequest;
use App\Modules\Tracking\Services\TrackingClientService;
use Illuminate\Http\Request;

class TrackingClientController extends BaseApiController
{
    public function __construct(private TrackingClientService $clientService) {}

    public function index(Request $request)
    {
        $clients = $this->clientService->list(search: $request->query('search'));

        return $this->paginatedResponse($clients, 'Clientes obtenidos');
    }

    public function store(CreateTrackingClientRequest $request)
    {
        $client = $this->clientService->create($request->validated());

        return $this->createdResponse($client, 'Cliente registrado');
    }

    public function show(int $trackingClient)
    {
        return $this->successResponse($this->clientService->getById($trackingClient));
    }

    public function update(UpdateTrackingClientRequest $request, int $trackingClient)
    {
        $updated = $this->clientService->update($trackingClient, $request->validated());

        return $this->successResponse($updated, 'Cliente actualizado');
    }

    public function destroy(int $trackingClient)
    {
        $this->clientService->delete($trackingClient);

        return $this->noContentResponse();
    }
}
