<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Movement;
use App\Modules\Inventory\Models\Tool;
use App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface;
use App\Modules\Inventory\Repositories\Contracts\ToolRepositoryInterface;
use App\Modules\Shared\Services\BaseService;
use Illuminate\Support\Facades\DB;

class ToolService extends BaseService
{
    public function __construct(
        private ToolRepositoryInterface $toolRepository,
        private MovementRepositoryInterface $movementRepository
    ) {
        parent::__construct($toolRepository);
    }

    public function list(int $perPage = 15, ?string $search = null)
    {
        return $this->toolRepository->paginateOrderedByCode($perPage, $search);
    }

    public function create(array $data)
    {
        if (empty($data['code'])) {
            $data['code'] = $this->toolRepository->generateUniqueCode();
        }

        $data['status'] = $data['status'] ?? Tool::STATUS_AVAILABLE;
        $data['quantity'] = $data['quantity'] ?? 1;

        return DB::transaction(function () use ($data) {
            $tool = $this->toolRepository->create($data);

            $this->movementRepository->create([
                'tool_id' => $tool->id,
                'user_id' => auth()->id(),
                'type' => Movement::TYPE_ADJUSTMENT,
                'quantity' => $tool->quantity,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Registro inicial de herramienta.'],
            ]);

            return $tool;
        });
    }

    public function update($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $tool = parent::update($id, $data);

            $this->movementRepository->create([
                'tool_id' => $tool->id,
                'user_id' => auth()->id(),
                'type' => Movement::TYPE_ADJUSTMENT,
                'quantity' => $tool->quantity,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Actualización de datos de la herramienta.'],
            ]);

            return $tool;
        });
    }

    public function updateStatus(int $id, string $status, ?array $details = null)
    {
        $tool = $this->toolRepository->find($id);

        if ($tool->status === $status) {
            return $tool;
        }

        return DB::transaction(function () use ($id, $status, $details, $tool) {
            $tool = $this->toolRepository->update($id, ['status' => $status]);

            $type = match ($status) {
                Tool::STATUS_MAINTENANCE => Movement::TYPE_MAINTENANCE,
                Tool::STATUS_BORROWED => Movement::TYPE_BORROWED,
                Tool::STATUS_AVAILABLE => Movement::TYPE_RETURN,
                default => Movement::TYPE_ADJUSTMENT,
            };

            $this->movementRepository->create([
                'tool_id' => $tool->id,
                'user_id' => auth()->id(),
                'type' => $type,
                'quantity' => $tool->quantity,
                'details' => $details ?? ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => "Cambio de estado a {$status}"],
            ]);

            return $tool;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $tool = $this->toolRepository->find($id);

            $this->movementRepository->create([
                'tool_id' => $tool->id,
                'user_id' => auth()->id(),
                'type' => Movement::TYPE_ADJUSTMENT,
                'quantity' => $tool->quantity,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Eliminación lógica de herramienta.'],
            ]);

            return $this->toolRepository->delete($id);
        });
    }
}
