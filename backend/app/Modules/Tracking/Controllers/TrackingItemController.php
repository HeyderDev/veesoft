<?php

namespace App\Modules\Tracking\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Tracking\Requests\CreateTrackingItemRequest;
use App\Modules\Tracking\Requests\UpdateTrackingItemRequest;
use App\Modules\Tracking\Services\TrackingItemService;
use Illuminate\Http\Request;

class TrackingItemController extends BaseApiController
{
    public function __construct(private TrackingItemService $itemService) {}

    public function index(Request $request)
    {
        $items = $this->itemService->list(
            search: $request->query('search'),
            stage: $request->query('stage'),
        );

        return $this->paginatedResponse($items, 'Ítems de seguimiento obtenidos');
    }

    public function store(CreateTrackingItemRequest $request)
    {
        $item = $this->itemService->create($request->validated());

        return $this->createdResponse($item, 'Ítem registrado');
    }

    public function show(int $trackingItem)
    {
        return $this->successResponse($this->itemService->getDetail($trackingItem));
    }

    public function update(UpdateTrackingItemRequest $request, int $trackingItem)
    {
        $updated = $this->itemService->update($trackingItem, $request->validated());

        return $this->successResponse($updated, 'Ítem actualizado');
    }

    public function destroy(int $trackingItem)
    {
        $this->itemService->delete($trackingItem);

        return $this->noContentResponse();
    }
}
