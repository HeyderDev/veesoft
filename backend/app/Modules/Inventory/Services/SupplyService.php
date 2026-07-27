<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Movement;
use App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface;
use App\Modules\Inventory\Repositories\Contracts\SupplyRepositoryInterface;
use App\Modules\Shared\Services\BaseService;
use Illuminate\Support\Facades\DB;

class SupplyService extends BaseService
{
    public function __construct(
        private SupplyRepositoryInterface $supplyRepository,
        private MovementRepositoryInterface $movementRepository
    ) {
        parent::__construct($supplyRepository);
    }

    public function list(int $perPage = 15, ?string $search = null)
    {
        return $this->supplyRepository->paginateOrderedBySku($perPage, $search);
    }

    public function create(array $data)
    {
        if (empty($data['sku'])) {
            $data['sku'] = $this->supplyRepository->generateUniqueSku();
        }

        return DB::transaction(function () use ($data) {
            $supply = $this->supplyRepository->create($data);

            $this->movementRepository->create([
                'supply_id' => $supply->id,
                'user_id' => auth()->id(),
                'type' => Movement::TYPE_ADJUSTMENT,
                'quantity' => $supply->current_stock,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Registro inicial de insumo.'],
            ]);

            return $supply;
        });
    }

    public function update($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $supply = parent::update($id, $data);

            $this->movementRepository->create([
                'supply_id' => $supply->id,
                'user_id' => auth()->id(),
                'type' => Movement::TYPE_ADJUSTMENT,
                'quantity' => $supply->current_stock,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Actualización de datos del insumo.'],
            ]);

            return $supply;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $supply = $this->supplyRepository->find($id);

            $this->movementRepository->create([
                'supply_id' => $supply->id,
                'user_id' => auth()->id(),
                'type' => Movement::TYPE_ADJUSTMENT,
                'quantity' => $supply->current_stock,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Eliminación lógica de insumo.'],
            ]);

            return $this->supplyRepository->delete($id);
        });
    }
}
