<?php

namespace App\Modules\Tasks\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Tasks\Models\OperationalTask;
use App\Modules\Tasks\Repositories\Contracts\OperationalTaskRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class OperationalTaskRepository extends BaseRepository implements OperationalTaskRepositoryInterface
{
    public function __construct(OperationalTask $model)
    {
        parent::__construct($model);
    }

    /**
     * Vista unificada de "Actividades" — reemplaza los antiguos endpoints
     * separados de Generales/Por Lote/Historial. `scope` acepta 'general',
     * 'lot:{id}' o se omite para traer todo.
     */
    public function paginateWithRelations(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->with(['assignee', 'resources', 'activityType', 'lotCyclePhase.lotCycle.lot']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Opcional a propósito: sin este filtro el índice se mantiene igual que
        // siempre (todas las actividades sin importar la meta) — otros
        // consumidores (ej. el panorama de riesgo de recursos en Logistics) ya
        // dependen de ese comportamiento por defecto.
        if (! empty($filters['goal_id'])) {
            $query->where('production_goal_id', $filters['goal_id']);
        }

        $scope = $filters['scope'] ?? null;
        if ($scope === 'general') {
            $query->whereNull('lot_cycle_phase_id');
        } elseif (is_string($scope) && str_starts_with($scope, 'lot:')) {
            $lotId = (int) substr($scope, 4);
            $query->whereHas('lotCyclePhase.lotCycle', fn ($q) => $q->where('lot_id', $lotId));
        }

        return $query->latest()->paginate($perPage);
    }

    public function findWithRelations(int $id)
    {
        return $this->model->with(['assignee', 'resources', 'activityType', 'lotCyclePhase.lotCycle.lot'])->findOrFail($id);
    }

    public function getTasksByAssignee(int $userId): Collection
    {
        return $this->model->with(['assignee', 'resources'])
            ->where('assigned_to', $userId)
            ->latest()
            ->get();
    }

    /**
     * Cards de la sección Actividades: contabilizadas dentro de la meta de
     * producción abierta del vivero. Sin meta abierta no hay nada que contar
     * (así es como los contadores "se reinician" al culminar una meta).
     */
    public function getSummary(int $viveroId, ?int $goalId): array
    {
        if (! $goalId) {
            return [
                'general' => ['completed' => 0, 'total' => 0],
                'by_lot' => [],
                'overall' => ['completed' => 0, 'total' => 0],
            ];
        }

        $generalTotal = $this->model->where('vivero_id', $viveroId)
            ->where('production_goal_id', $goalId)
            ->whereNull('lot_cycle_phase_id')
            ->count();
        $generalCompleted = $this->model->where('vivero_id', $viveroId)
            ->where('production_goal_id', $goalId)
            ->whereNull('lot_cycle_phase_id')
            ->where('status', 'completed')
            ->count();

        $byLot = DB::table('operational_tasks')
            ->join('lot_cycle_phases', 'operational_tasks.lot_cycle_phase_id', '=', 'lot_cycle_phases.id')
            ->join('lot_cycles', 'lot_cycle_phases.lot_cycle_id', '=', 'lot_cycles.id')
            ->join('lots', 'lot_cycles.lot_id', '=', 'lots.id')
            ->where('operational_tasks.vivero_id', $viveroId)
            ->where('operational_tasks.production_goal_id', $goalId)
            ->select(
                'lots.id as lot_id',
                'lots.code as lot_code',
                'lots.name as lot_name',
                DB::raw('COUNT(operational_tasks.id) as total'),
                DB::raw("SUM(CASE WHEN operational_tasks.status = 'completed' THEN 1 ELSE 0 END) as completed"),
            )
            ->groupBy('lots.id', 'lots.code', 'lots.name')
            ->get()
            ->toArray();

        $overallTotal = $this->model->where('vivero_id', $viveroId)->where('production_goal_id', $goalId)->count();
        $overallCompleted = $this->model->where('vivero_id', $viveroId)
            ->where('production_goal_id', $goalId)
            ->where('status', 'completed')
            ->count();

        return [
            'general' => ['completed' => $generalCompleted, 'total' => $generalTotal],
            'by_lot' => $byLot,
            'overall' => ['completed' => $overallCompleted, 'total' => $overallTotal],
        ];
    }

    /**
     * Conteo de actividades por día para el calendario mensual de Actividades,
     * mismo alcance de meta abierta que getSummary().
     */
    public function getCalendar(int $viveroId, ?int $goalId, int $year, int $month): array
    {
        if (! $goalId) {
            return [];
        }

        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = (clone $start)->endOfMonth();

        return $this->model
            ->where('vivero_id', $viveroId)
            ->where('production_goal_id', $goalId)
            ->whereBetween('planned_date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('planned_date, COUNT(*) as day_count')
            ->groupBy('planned_date')
            ->get()
            ->map(fn ($row) => [
                'date' => Carbon::parse($row->planned_date)->toDateString(),
                'count' => (int) $row->day_count,
            ])
            ->values()
            ->all();
    }

    /**
     * Consulta histórica por período (Año/Mes/Día) para la sección Reportes —
     * a propósito NO se filtra por meta de producción: es una búsqueda libre
     * que puede cruzar varias metas a lo largo del tiempo.
     */
    public function getReportQuery(int $viveroId, int $year, ?int $month, ?int $day): array
    {
        $start = Carbon::create($year, $month ?? 1, $day ?? 1)->startOfDay();
        $end = $day
            ? (clone $start)->endOfDay()
            : ($month ? (clone $start)->endOfMonth()->endOfDay() : (clone $start)->endOfYear()->endOfDay());

        $tasks = $this->model
            ->with(['assignee', 'resources', 'activityType', 'lotCyclePhase.lotCycle.lot'])
            ->where('vivero_id', $viveroId)
            ->whereBetween('planned_date', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('planned_date')
            ->get();

        return [
            'total' => $tasks->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'pending' => $tasks->where('status', 'pending')->count(),
            'tasks' => $tasks->values(),
        ];
    }
}
