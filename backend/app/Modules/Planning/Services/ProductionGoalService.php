<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Models\LotCycle;
use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Repositories\Contracts\ProductionGoalRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ViveroRepositoryInterface;
use App\Modules\Shared\Services\BaseService;
use App\Modules\Shared\Support\GatedPhaseCatalog;
use Illuminate\Support\Facades\DB;

/**
 * Reglas de negocio de la Meta de Producción:
 * - Un vivero solo puede tener una meta sin culminar a la vez.
 * - El estado (not_started/active/completed) nunca lo elige el usuario: lo calcula el
 *   sistema. Este Service es el único lugar autorizado para cambiarlo.
 * - Solo se puede eliminar una meta en estado "not_started".
 * - "Culminar" es la única forma de cerrar una meta activa o completada, y libera al
 *   vivero para poder crear una meta nueva.
 * - "not_started" -> "active" es automático: LotCycleService la dispara al primer
 *   "Comenzar Ciclo" registrado sobre un lote del vivero.
 * - "active" -> "completed" es automático: LotCycleService la dispara cuando la suma de
 *   plántulas despachadas alcanza target_seedlings.
 */
class ProductionGoalService extends BaseService
{
    public function __construct(
        private ProductionGoalRepositoryInterface $goalRepository,
        private ViveroRepositoryInterface $viveroRepository,
    ) {
        parent::__construct($goalRepository);
    }

    public function list(int $perPage = 15)
    {
        return $this->goalRepository->paginateWithRelations($perPage);
    }

    public function getDetail(int $id)
    {
        return $this->goalRepository->findWithRelations($id);
    }

    public function create(array $data)
    {
        $viveroId = (int) $data['vivero_id'];

        if ($this->viveroRepository->hasOpenGoal($viveroId)) {
            throw new \DomainException('Este vivero ya tiene una meta en curso. Culmínala antes de crear una nueva.');
        }

        $data['status'] = ProductionGoal::STATUS_NOT_STARTED;
        $data['finished_at'] = null;

        $goal = DB::transaction(function () use ($data, $viveroId) {
            $goal = $this->goalRepository->create($data);

            $this->reassignPendingFixedActivities($viveroId, $goal->id);

            return $goal;
        });

        return $this->goalRepository->findWithRelations($goal->id);
    }

    /**
     * Al crear una meta nueva ya no hay meta abierta previa (create() lo exige),
     * así que cualquier ciclo de lote todavía "in_progress" quedó colgado de una
     * meta ya culminada. Las 3 actividades fijas (Siembra/Injerto/Despacho) sin
     * realizar de esos ciclos siempre pertenecen a la meta ACTUAL — se reasignan
     * a la meta recién creada tanto el propio ciclo (para que el despacho que se
     * registre después acredite a la meta nueva, ver LotCycleService::recordDispatch())
     * como sus tareas fijas pendientes (para el selector de meta en Actividades).
     * Antes de que exista una meta nueva, se quedan ligadas a la anterior tal
     * cual — recién en este momento la meta anterior queda totalmente culminada
     * sin cabos sueltos (ver historial de metas).
     */
    private function reassignPendingFixedActivities(int $viveroId, int $newGoalId): void
    {
        $staleCycleIds = LotCycle::whereHas('lot', fn ($q) => $q->where('vivero_id', $viveroId))
            ->where('status', LotCycle::STATUS_IN_PROGRESS)
            ->where('production_goal_id', '!=', $newGoalId)
            ->pluck('id');

        if ($staleCycleIds->isEmpty()) {
            return;
        }

        LotCycle::whereIn('id', $staleCycleIds)->update(['production_goal_id' => $newGoalId]);

        $fixedActivityTypeIds = DB::table('activity_types')
            ->where('vivero_id', $viveroId)
            ->whereIn('system_code', array_values(GatedPhaseCatalog::SYSTEM_ACTIVITY_CODE))
            ->pluck('id');

        if ($fixedActivityTypeIds->isEmpty()) {
            return;
        }

        DB::table('operational_tasks')
            ->whereIn('activity_type_id', $fixedActivityTypeIds)
            ->where('status', 'pending')
            ->whereIn('lot_cycle_phase_id', function ($query) use ($staleCycleIds) {
                $query->select('id')->from('lot_cycle_phases')->whereIn('lot_cycle_id', $staleCycleIds);
            })
            ->update(['production_goal_id' => $newGoalId]);
    }

    public function update($id, array $data)
    {
        $goal = $this->goalRepository->find($id);

        if ($goal->isCulminated()) {
            throw new \DomainException('No se puede editar una meta ya culminada.');
        }

        parent::update($id, $data);

        return $this->goalRepository->findWithRelations($id);
    }

    public function delete($id)
    {
        $goal = $this->goalRepository->find($id);

        if ($goal->status !== ProductionGoal::STATUS_NOT_STARTED) {
            throw new \DomainException('Solo se puede eliminar una meta que aún no ha iniciado. Usa Culminar Meta.');
        }

        return $this->goalRepository->delete($id);
    }

    public function culminar(int $id)
    {
        $goal = $this->goalRepository->find($id);

        if ($goal->isCulminated()) {
            throw new \DomainException('Esta meta ya está culminada.');
        }

        if ($goal->status === ProductionGoal::STATUS_NOT_STARTED) {
            throw new \DomainException('No se puede culminar una meta que todavía no ha iniciado.');
        }

        // Culminar normaliza el status a completed siempre — antes podía quedar
        // "active" con finished_at puesto si nunca llegó al target, dos señales
        // independientes de "está culminada" que se prestaban a confusión.
        $this->goalRepository->update($id, [
            'finished_at' => now(),
            'status' => ProductionGoal::STATUS_COMPLETED,
        ]);

        return $this->goalRepository->findWithRelations($id);
    }

    /**
     * Historial de metas del vivero (abiertas y culminadas) con sus números:
     * despachado (ya viene en paginateWithRelations vía withSum), ciclos
     * productivos, lotes distintos usados y actividades completadas. Una meta
     * culminada nunca se borra ni pierde su historial — solo deja de poder
     * recibir ciclos/actividades nuevos (ver LotCycleService::startCycle() y
     * OperationalTaskService::createTask(), que resuelven la meta vía
     * findOpenForVivero()).
     */
    public function getHistory(): array
    {
        $goals = $this->goalRepository->paginateWithRelations(perPage: 100);

        return collect($goals->items())->map(fn (ProductionGoal $goal) => [
            'id' => $goal->id,
            'title' => $goal->title,
            'status' => $goal->status,
            'finished_at' => $goal->finished_at,
            'created_at' => $goal->created_at,
            'target_seedlings' => $goal->target_seedlings,
            'produced_seedlings' => $goal->produced_seedlings,
            'lot_cycles_count' => LotCycle::where('production_goal_id', $goal->id)->count(),
            'distinct_lots_count' => LotCycle::where('production_goal_id', $goal->id)->distinct('lot_id')->count('lot_id'),
            'tasks_completed_count' => DB::table('operational_tasks')
                ->where('production_goal_id', $goal->id)
                ->where('status', 'completed')
                ->count(),
        ])->all();
    }

    /**
     * Lista liviana de metas del vivero (para el selector de meta en
     * Actividades — ver Tasks\Services\OperationalTaskService::getGoalsForSelector()).
     */
    public function listForVivero(int $viveroId): array
    {
        return ProductionGoal::where('vivero_id', $viveroId)
            ->withSum('dispatches as produced_seedlings', 'quantity')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ProductionGoal $goal) => [
                'id' => $goal->id,
                'title' => $goal->title,
                'status' => $goal->status,
                'finished_at' => $goal->finished_at,
                'target_seedlings' => $goal->target_seedlings,
                'produced_seedlings' => $goal->produced_seedlings,
            ])->all();
    }

    public function findOpenForVivero(int $viveroId)
    {
        return $this->goalRepository->findOpenForVivero($viveroId);
    }

    /**
     * Historial de lotes/ciclos asociados a una meta, para la vista de
     * histórico "por meta y, dentro de cada meta, por ciclo" (Fase 5).
     */
    public function getLotCycles(int $id)
    {
        $goal = $this->goalRepository->find($id);

        return $goal->lotCycles()
            ->with(['lot', 'phases.phase'])
            ->orderByDesc('started_at')
            ->get();
    }

    public function activateIfNotStarted(int $id): void
    {
        $goal = $this->goalRepository->find($id);

        if ($goal->status === ProductionGoal::STATUS_NOT_STARTED) {
            $this->goalRepository->update($id, ['status' => ProductionGoal::STATUS_ACTIVE]);
        }
    }

    public function completeIfTargetReached(int $id): void
    {
        $goal = $this->goalRepository->find($id);

        if ($goal->status !== ProductionGoal::STATUS_ACTIVE) {
            return;
        }

        $dispatched = $this->goalRepository->sumDispatchedQuantity($id);

        if ($dispatched >= $goal->target_seedlings) {
            $this->goalRepository->update($id, ['status' => ProductionGoal::STATUS_COMPLETED]);
        }
    }
}
