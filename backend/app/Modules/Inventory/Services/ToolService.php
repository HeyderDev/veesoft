<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Movement;
use App\Modules\Inventory\Models\Tool;
use App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface;
use App\Modules\Inventory\Repositories\Contracts\ToolRepositoryInterface;
use App\Modules\Shared\Services\BaseService;
use Illuminate\Support\Facades\DB;

use App\Modules\Inventory\Repositories\Contracts\ToolUnitRepositoryInterface;

class ToolService extends BaseService
{
    public function __construct(
        private ToolRepositoryInterface $toolRepository,
        private ToolUnitRepositoryInterface $toolUnitRepository,
        private MovementRepositoryInterface $movementRepository
    ) {
        parent::__construct($toolRepository);
    }

    public function list(int $perPage = 15, ?string $search = null)
    {
        return $this->toolRepository->paginateWithUnits($perPage, $search);
    }

    public function getDetail($id)
    {
        return $this->toolRepository->find($id)->load('units');
    }

    public function create(array $data)
    {
        $quantity = $data['quantity'] ?? 1;

        return DB::transaction(function () use ($data, $quantity) {
            $tool = $this->toolRepository->create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
            ]);

            for ($i = 0; $i < $quantity; $i++) {
                $code = $this->toolUnitRepository->generateUniqueCode();
                $unit = $this->toolUnitRepository->create([
                    'tool_id' => $tool->id,
                    'code' => $code,
                    'status' => 'available',
                ]);

                $this->movementRepository->create([
                    'tool_id' => $tool->id,
                    'tool_unit_id' => $unit->id,
                    'user_id' => auth()->id(),
                    'type' => Movement::TYPE_ADJUSTMENT,
                    'quantity' => 1,
                    'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Registro inicial de unidad.'],
                ]);
            }

            return $tool->load('units');
        });
    }

    public function update($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            return parent::update($id, [
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
            ]);
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $tool = $this->toolRepository->find($id);
            // Optional: delete or mark units as out_of_service here.
            // For now just logically delete the tool.
            return $this->toolRepository->delete($id);
        });
    }
}
