<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Events\InventoryMovementCreated;
use App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface;
use App\Modules\Shared\Services\BaseService;

class MovementService extends BaseService
{
    public function __construct(MovementRepositoryInterface $movementRepository)
    {
        parent::__construct($movementRepository);
    }

    public function list(int $perPage = 15, ?string $type = null, ?string $search = null, ?string $startDate = null, ?string $endDate = null)
    {
        return $this->repository->paginateWithRelations($perPage, $type, $search, $startDate, $endDate);
    }

    public function createMovement(array $data)
    {
        $movement = $this->create($data);
        event(new InventoryMovementCreated($movement->id));

        return $movement;
    }
}
