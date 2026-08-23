<?php

namespace App\Modules\Inventory\Repositories\Eloquent;

use App\Modules\Shared\Models\Student;
use App\Modules\Inventory\Repositories\Contracts\StudentRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StudentRepository extends BaseRepository implements StudentRepositoryInterface
{
    public function __construct(Student $model)
    {
        parent::__construct($model);
    }

    public function paginateStudents(int $perPage = 15, ?string $search = null, ?string $status = null, ?string $career = null, ?int $semester = null): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('cedula', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($career) {
            $query->where('career', 'like', "%{$career}%");
        }

        if ($semester) {
            $query->where('semester', $semester);
        }

        return $query->orderBy('last_name')->orderBy('first_name')->paginate($perPage);
    }

    public function findByCedula(string $cedula)
    {
        return $this->model->newQuery()->where('cedula', $cedula)->first();
    }
}
