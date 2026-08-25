<?php

namespace App\Modules\Tasks\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface OperationalTaskRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateWithRelations(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function findWithRelations(int $id);

    public function getTasksByAssignee(int $userId);

    public function getSummary(int $viveroId, ?int $goalId): array;

    public function getCalendar(int $viveroId, ?int $goalId, int $year, int $month): array;

    public function getReportQuery(int $viveroId, int $year, ?int $month, ?int $day): array;
}
