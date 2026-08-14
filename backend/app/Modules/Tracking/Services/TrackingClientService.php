<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Shared\Services\BaseService;
use App\Modules\Tracking\Events\TrackingClientCreated;
use App\Modules\Tracking\Events\TrackingClientDeleted;
use App\Modules\Tracking\Events\TrackingClientUpdated;
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

    public function create(array $data)
    {
        $client = parent::create($data);
        event(new TrackingClientCreated($client->id));

        return $client;
    }

    public function update($id, array $data)
    {
        $client = parent::update($id, $data);
        event(new TrackingClientUpdated($client->id));

        return $client;
    }

    public function delete($id)
    {
        $deleted = parent::delete($id);

        if ($deleted) {
            event(new TrackingClientDeleted($id));
        }

        return $deleted;
    }
}
