<?php

namespace App\Modules\Tasks\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Tasks\Models\OperationalTask;
use App\Modules\Tasks\Repositories\Contracts\OperationalTaskRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class OperationalTaskRepository extends BaseRepository implements OperationalTaskRepositoryInterface
{
    public function __construct(OperationalTask $model)
    {
        parent::__construct($model);
    }

    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->with(['assignedTo', 'resources'])
            ->whereNull('lot_cycle_phase_id')
            ->latest()
            ->paginate($perPage);
    }

    public function findWithRelations(int $id)
    {
        return $this->model->with(['assignedTo', 'resources'])->findOrFail($id);
    }

    public function getTasksByAssignee(int $userId): Collection
    {
        return $this->model->with(['assignedTo', 'resources'])
            ->where('assigned_to', $userId)
            ->latest()
            ->get();
    }

    public function getTasksByLot(int $lotId): Collection
    {
        return $this->model
            ->with(['assignedTo', 'resources', 'lotCyclePhase.lotCycle.lot'])
            ->whereHas('lotCyclePhase.lotCycle', fn ($q) => $q->where('lot_id', $lotId))
            ->latest()
            ->get();
    }

    public function getHistory(array $filters = []): Collection
    {
        $query = $this->model->with(['assignedTo', 'resources', 'lotCyclePhase.lotCycle.lot'])->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['type'])) {
            if ($filters['type'] === 'general') {
                $query->whereNull('lot_cycle_phase_id');
            } elseif ($filters['type'] === 'lot') {
                $query->whereNotNull('lot_cycle_phase_id');
            }
        }

        return $query->get();
    }

    public function getReport(): array
    {
        $total = $this->model->count();
        $pending = $this->model->where('status', 'pending')->count();
        $completed = $this->model->where('status', 'completed')->count();

        $byLot = DB::table('operational_tasks')
            ->join('lot_cycle_phases', 'operational_tasks.lot_cycle_phase_id', '=', 'lot_cycle_phases.id')
            ->join('lot_cycles', 'lot_cycle_phases.lot_cycle_id', '=', 'lot_cycles.id')
            ->join('lots', 'lot_cycles.lot_id', '=', 'lots.id')
            ->select(
                'lots.id as lot_id',
                'lots.code as lot_code',
                'lots.name as lot_name',
                DB::raw('COUNT(operational_tasks.id) as total'),
                DB::raw("SUM(CASE WHEN operational_tasks.status = 'pending' THEN 1 ELSE 0 END) as pending"),
                DB::raw("SUM(CASE WHEN operational_tasks.status = 'completed' THEN 1 ELSE 0 END) as completed"),
            )
            ->groupBy('lots.id', 'lots.code', 'lots.name')
            ->get()
            ->toArray();

        return [
            'total' => $total,
            'pending' => $pending,
            'completed' => $completed,
            'by_lot' => $byLot,
        ];
    }
}
