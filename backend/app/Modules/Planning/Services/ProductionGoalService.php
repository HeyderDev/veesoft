<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Repositories\Contracts\ProductionGoalRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ViveroRepositoryInterface;
use App\Modules\Shared\Services\BaseService;

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
        if ($this->viveroRepository->hasOpenGoal((int) $data['vivero_id'])) {
            throw new \DomainException('Este vivero ya tiene una meta en curso. Culmínala antes de crear una nueva.');
        }

        $data['status'] = ProductionGoal::STATUS_NOT_STARTED;
        $data['finished_at'] = null;

        $goal = $this->goalRepository->create($data);

        return $this->goalRepository->findWithRelations($goal->id);
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

        $this->goalRepository->update($id, ['finished_at' => now()]);

        return $this->goalRepository->findWithRelations($id);
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
