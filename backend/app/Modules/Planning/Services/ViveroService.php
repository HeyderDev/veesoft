<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Repositories\Contracts\ViveroRepositoryInterface;
use App\Modules\Shared\Services\BaseService;
use Illuminate\Support\Facades\DB;

class ViveroService extends BaseService
{
    public function __construct(
        private ViveroRepositoryInterface $viveroRepository,
        private ProductionPhaseService $phaseService,
    ) {
        parent::__construct($viveroRepository);
    }

    public function list(int $perPage = 15)
    {
        return $this->viveroRepository->paginateWithCurrentMeta($perPage);
    }

    public function getDetail(int $id)
    {
        return $this->viveroRepository->findWithRelations($id);
    }

    /**
     * Todo vivero nace con su propio set de fases (editable después) — ver
     * ProductionPhaseService::seedDefaultsForVivero().
     */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            $vivero = $this->repository->create($data);
            $this->phaseService->seedDefaultsForVivero($vivero->id);

            return $vivero;
        });
    }
}
