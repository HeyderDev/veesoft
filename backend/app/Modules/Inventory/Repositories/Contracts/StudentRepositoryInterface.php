<?php

namespace App\Modules\Inventory\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StudentRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateStudents(int $perPage = 15, ?string $search = null, ?string $status = null, ?string $career = null, ?int $semester = null): LengthAwarePaginator;
    public function findByCedula(string $cedula);
}
