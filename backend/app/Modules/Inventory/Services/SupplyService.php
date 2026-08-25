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
                'type' => Movement::TYPE_CREATED,
                'quantity' => $supply->current_stock,
                'previous_stock' => 0,
                'new_stock' => $supply->current_stock,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Registro inicial de insumo.'],
            ]);

            return $supply;
        });
    }

    public function update($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $oldSupply = $this->supplyRepository->find($id);
            $previousStock = $oldSupply->current_stock;
            
            $supply = parent::update($id, $data);

            if (isset($data['current_stock']) && $previousStock != $data['current_stock']) {
                $this->movementRepository->create([
                    'supply_id' => $supply->id,
                    'user_id' => auth()->id(),
                    'type' => Movement::TYPE_ADJUSTMENT,
                    'quantity' => abs($data['current_stock'] - $previousStock),
                    'previous_stock' => $previousStock,
                    'new_stock' => $data['current_stock'],
                    'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Actualización manual de stock en edición de insumo.'],
                ]);
            }

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
                'type' => Movement::TYPE_DELETED,
                'quantity' => $supply->current_stock,
                'previous_stock' => $supply->current_stock,
                'new_stock' => 0,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Eliminación lógica de insumo.'],
            ]);

            return $this->supplyRepository->delete($id);
        });
    }

    public function findBySku(string $sku)
    {
        return $this->supplyRepository->findBySku($sku);
    }

    public function registerMovement(int $id, string $type, float $quantity, ?string $reason = null, ?string $observation = null, ?string $scannedCode = null, ?int $studentId = null)
    {
        return DB::transaction(function () use ($id, $type, $quantity, $reason, $observation, $scannedCode, $studentId) {
            $supply = $this->supplyRepository->find($id);
            $previousStock = $supply->current_stock;
            $newStock = $previousStock;

            if ($type === 'ENTRADA') {
                $newStock += $quantity;
            } elseif ($type === 'SALIDA') {
                if ($previousStock < $quantity) {
                    throw new \Exception("Stock insuficiente.\nStock disponible: {$previousStock} {$supply->unit}\nCantidad solicitada: {$quantity} {$supply->unit}");
                }
                $newStock -= $quantity;
            } elseif ($type === 'AJUSTE') {
                $newStock = $quantity; // para ajuste, asumo que quantity es el nuevo stock físico
                $quantity = abs($newStock - $previousStock); // cantidad de la diferencia
            } else {
                throw new \Exception("Tipo de movimiento inválido");
            }

            // Actualizar stock
            $this->supplyRepository->update($id, ['current_stock' => $newStock]);

            // Registrar movimiento
            $movement = $this->movementRepository->create([
                'supply_id' => $supply->id,
                'user_id' => auth()->id(),
                'student_id' => $studentId,
                'type' => $type,
                'quantity' => $quantity,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reason' => $reason,
                'observations' => $observation,
                'scanned_code' => $scannedCode,
                'batch' => $supply->batch,
                'details' => ['usuario' => auth()->user()?->name ?? 'Sistema', 'detalles' => 'Registro de movimiento vía escaner/manual.'],
            ]);

            return [
                'supply' => $supply->fresh(),
                'movement' => $movement,
            ];
        });
    }
}
