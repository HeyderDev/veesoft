<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Movement;
use App\Modules\Inventory\Models\ToolUnit;
use App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface;
use App\Modules\Inventory\Repositories\Contracts\ToolUnitRepositoryInterface;
use App\Modules\Shared\Services\BaseService;
use Illuminate\Support\Facades\DB;

class ToolUnitService extends BaseService
{
    public function __construct(
        private ToolUnitRepositoryInterface $toolUnitRepository,
        private MovementRepositoryInterface $movementRepository
    ) {
        parent::__construct($toolUnitRepository);
    }

    public function getDetail($id)
    {
        return $this->toolUnitRepository->find($id)->load('tool', 'movements.user');
    }

    public function createUnitForTool(int $toolId)
    {
        return DB::transaction(function () use ($toolId) {
            $code = $this->toolUnitRepository->generateUniqueCode();
            $unit = $this->toolUnitRepository->create([
                'tool_id' => $toolId,
                'code' => $code,
                'status' => 'available',
            ]);

            $this->movementRepository->create([
                'tool_id' => $toolId,
                'tool_unit_id' => $unit->id,
                'user_id' => auth()->id(),
                'type' => Movement::TYPE_ADJUSTMENT,
                'quantity' => 1,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Registro de unidad adicional.'],
            ]);

            return $unit;
        });
    }

    public function updateStatus(int $id, string $status, ?array $details = null)
    {
        $unit = $this->toolUnitRepository->find($id);

        if ($unit->status === $status) {
            return $unit;
        }

        if ($status === 'borrowed') {
            if (empty($details['student_id'])) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'student_id' => 'Se requiere asignar un estudiante activo para prestar la herramienta.'
                ]);
            }
        }

        if ($status === 'available' && $unit->status === 'borrowed') {
            $lastMovement = $unit->movements()->latest('id')->first();
            if ($lastMovement && $lastMovement->student_id) {
                if (empty($details['student_id']) || $details['student_id'] != $lastMovement->student_id) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'student_id' => 'Esta herramienta solo puede ser devuelta por el estudiante que la solicitó originalmente.'
                    ]);
                }
            }
        }

        return DB::transaction(function () use ($id, $status, $details, $unit) {
            $unit = $this->toolUnitRepository->update($id, ['status' => $status]);

            $type = match ($status) {
                'maintenance' => Movement::TYPE_MAINTENANCE,
                'borrowed' => Movement::TYPE_BORROWED,
                'available' => Movement::TYPE_RETURN,
                'out_of_service' => 'decommissioned',
                default => Movement::TYPE_ADJUSTMENT,
            };

            $mergedDetails = array_merge([
                'usuario' => auth()->user()?->name ?? 'Sistema',
                'detalles' => "Cambio de estado a {$status}"
            ], $details ?? []);

            $this->movementRepository->create([
                'tool_id' => $unit->tool_id,
                'tool_unit_id' => $unit->id,
                'user_id' => auth()->id(),
                'student_id' => $details['student_id'] ?? null,
                'type' => $type,
                'quantity' => 1,
                'details' => $mergedDetails,
                'observations' => $details['motivo'] ?? null,
            ]);

            return $unit;
        });
    }

    public function findByCode(string $code)
    {
        return $this->toolUnitRepository->findByCode($code);
    }

    public function deleteUnit(int $id, ?string $motivo = null)
    {
        return DB::transaction(function () use ($id, $motivo) {
            $unit = $this->toolUnitRepository->find($id);

            $this->movementRepository->create([
                'tool_id' => $unit->tool_id,
                'tool_unit_id' => $unit->id,
                'user_id' => auth()->id(),
                'type' => 'decommissioned',
                'quantity' => 1,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => "Unidad eliminada del inventario."],
                'observations' => $motivo,
            ]);

            return $this->toolUnitRepository->delete($id);
        });
    }
}
