<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Shared\Services\BaseService;
use App\Modules\Tracking\Repositories\Contracts\TrackingItemRepositoryInterface;

class TrackingItemService extends BaseService
{
    public function __construct(
        private TrackingItemRepositoryInterface $itemRepository,
    ) {
        parent::__construct($itemRepository);
    }

    public function list(?string $search = null, ?string $stage = null, int $perPage = 15)
    {
        return $this->itemRepository->paginateWithFilters($search, $stage, $perPage);
    }

    public function getDetail(int $id)
    {
        return $this->itemRepository->findWithMovements($id);
    }

    public function create(array $data)
    {
        $data['registered_at'] = $data['registered_at'] ?? now();

        $item = $this->itemRepository->create($data);

        return $this->itemRepository->findWithMovements($item->id);
    }

    public function update($id, array $data)
    {
        parent::update($id, $data);

        return $this->itemRepository->findWithMovements($id);
    }
}
