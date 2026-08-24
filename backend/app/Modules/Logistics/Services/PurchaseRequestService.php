<?php

namespace App\Modules\Logistics\Services;

use App\Modules\Logistics\Models\PurchaseRequest;
use App\Modules\Logistics\Models\PurchaseRequestItem;
use App\Modules\Logistics\Repositories\Contracts\PurchaseRequestRepositoryInterface;
use App\Modules\Shared\Services\BaseService;
use Illuminate\Support\Facades\DB;

/**
 * Reglas de negocio de Solicitud de Aprovisionamiento:
 * - Es la puerta de entrada propuesta por el contrato del módulo (createPurchaseRequest())
 *   para cuando Inventory detecte stock bajo y dispare la creación automática de una
 *   solicitud; el sistema anterior no tenía este paso intermedio (generaba la orden
 *   directo), así que aquí también admite un flujo manual: un usuario pide insumos, un
 *   responsable la revisa.
 * - Solo se puede revisar (aprobar/rechazar) una solicitud 'pending'.
 * - Aprobar exige elegir un proveedor: convierte la solicitud en una PurchaseOrder real
 *   (reutilizando las reglas de PurchaseOrderService — proveedor activo y score >= 3.00)
 *   y la deja enlazada en `purchase_order_id`.
 */
class PurchaseRequestService extends BaseService
{
    public function __construct(
        private PurchaseRequestRepositoryInterface $purchaseRequestRepository,
        private PurchaseOrderService $purchaseOrderService,
    ) {
        parent::__construct($purchaseRequestRepository);
    }

    public function list(?\App\Modules\Shared\Models\User $user = null, int $perPage = 15)
    {
        if ($user?->role?->name === 'Operario') {
            return $this->purchaseRequestRepository->paginateForRequester($user->id, $perPage);
        }

        return $this->purchaseRequestRepository->paginateWithRelations($perPage);
    }

    public function getDetail(int $id, ?\App\Modules\Shared\Models\User $user = null)
    {
        $request = $this->purchaseRequestRepository->findWithRelations($id);

        if ($user?->role?->name === 'Operario' && $request->requested_by !== $user->id) {
            abort(403, 'No tienes permiso para ver esta solicitud.');
        }

        return $request;
    }

    /**
     * API pública consumida por otros módulos (ver docs/03_MODULE_CONTRACTS/Logistics.md).
     *
     * @param  array<int, array{item_type: 'supply'|'tool', item_id: int, quantity: float}>  $items
     */
    public function createPurchaseRequest(array $items, string $reason, ?int $requestedBy = null): PurchaseRequest
    {
        $request = DB::transaction(function () use ($items, $reason, $requestedBy) {
            $request = $this->purchaseRequestRepository->create([
                'requested_by' => $requestedBy,
                'reason' => $reason,
                'status' => PurchaseRequest::STATUS_PENDING,
            ]);

            foreach ($items as $item) {
                $model = $item['item_type'] === 'tool'
                    ? \App\Modules\Inventory\Models\Tool::query()->findOrFail($item['item_id'])
                    : \App\Modules\Inventory\Models\Supply::query()->findOrFail($item['item_id']);

                PurchaseRequestItem::create([
                    'purchase_request_id' => $request->id,
                    'supply_id' => $item['item_type'] === 'supply' ? $model->id : null,
                    'tool_id' => $item['item_type'] === 'tool' ? $model->id : null,
                    'item_sku' => $item['item_type'] === 'supply' ? $model->sku : 'HERR-'.$model->id,
                    'item_name' => $model->name,
                    'unit' => $item['item_type'] === 'supply' ? $model->unit : 'unidad',
                    'quantity' => $item['quantity'],
                ]);
            }

            return $request;
        });

        return $this->purchaseRequestRepository->findWithRelations($request->id);
    }

    public function review(int $id, string $decision, ?int $reviewedBy, array $data = []): PurchaseRequest
    {
        $request = $this->purchaseRequestRepository->findWithRelations($id);

        if ($request->status !== PurchaseRequest::STATUS_PENDING) {
            throw new \DomainException('Esta solicitud ya fue revisada.');
        }

        if ($decision === PurchaseRequest::STATUS_REJECTED) {
            $this->purchaseRequestRepository->update($id, [
                'status' => PurchaseRequest::STATUS_REJECTED,
                'reviewed_by' => $reviewedBy,
                'reviewed_at' => now(),
            ]);

            return $this->purchaseRequestRepository->findWithRelations($id);
        }

        $order = $this->purchaseOrderService->create([
            'supplier_id' => $data['supplier_id'],
            'created_by' => $reviewedBy,
            'estimated_delivery_date' => $data['estimated_delivery_date'] ?? null,
            'items' => $request->items->map(fn (PurchaseRequestItem $item) => [
                'item_type' => $item->tool_id ? 'tool' : 'supply',
                'item_id' => $item->tool_id ?? $item->supply_id,
                'quantity' => (float) $item->quantity,
            ])->all(),
        ]);

        $this->purchaseRequestRepository->update($id, [
            'status' => PurchaseRequest::STATUS_APPROVED,
            'reviewed_by' => $reviewedBy,
            'reviewed_at' => now(),
            'purchase_order_id' => $order->id,
        ]);

        return $this->purchaseRequestRepository->findWithRelations($id);
    }
}
