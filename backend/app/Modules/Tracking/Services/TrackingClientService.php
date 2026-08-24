<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Shared\Services\BaseService;
use App\Modules\Tracking\Repositories\Contracts\TrackingClientRepositoryInterface;

class TrackingClientService extends BaseService
{
    public function __construct(
        private TrackingClientRepositoryInterface $clientRepository,
    ) {
        parent::__construct($clientRepository);
    }

    public function list(?string $search = null, int $perPage = 15)
    {
        return $this->clientRepository->paginateWithSearch($search, $perPage);
    }
}
