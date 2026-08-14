<?php

namespace App\Modules\Tasks\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface OperationalTaskRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator;

    public function findWithRelations(int $id);

    public function getTasksByAssignee(int $userId);

    public function getTasksByLot(int $lotId): Collection;

    public function getHistory(array $filters = []): Collection;

    public function getReport(): array;

    public function exportForSync($id): array;

    public function applySynchronizedState($id, array $payload);
}
