<?php

namespace App\Modules\Logistics\Services;

use App\Modules\Inventory\Models\Supply;
use App\Modules\Inventory\Models\Tool;
use App\Modules\Logistics\Events\PurchaseOrderReceived;
use App\Modules\Logistics\Models\PurchaseOrder;
use App\Modules\Logistics\Models\PurchaseOrderItem;
use App\Modules\Logistics\Models\PurchaseReceipt;
use App\Modules\Logistics\Models\Supplier;
use App\Modules\Logistics\Repositories\Contracts\PurchaseOrderRepositoryInterface;
use App\Modules\Logistics\Repositories\Contracts\SupplierRepositoryInterface;
use App\Modules\Shared\Services\BaseService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Reglas de negocio de Orden de Compra (HU-05/HU-06/HU-08):
 * - Solo se puede emitir una orden a un proveedor 'active' con score >= 3.00.
 * - Sin fecha de entrega estimada, se asume hoy + 5 días (igual que el sistema anterior).
 * - El total es la suma de cantidad × precio_unitario de cada ítem.
 * - Una orden solo puede recibirse una vez.
 * - Recibir con calidad 'approved'/'conditional' dispara PurchaseOrderReceived (para que
 *   Inventory actualice stock cuando ese módulo exista); con 'rejected', la orden pasa a
 *   'cancelled'; en cualquier otro caso pasa a 'received'.
 * - El listado de pendientes clasifica cada ítem por urgencia según la fecha de entrega
 *   estimada de su orden: 'red' si ya venció, 'yellow' si es mañana, 'green' en otro caso.
 */
class PurchaseOrderService extends BaseService
{
    private const DEFAULT_LEAD_TIME_DAYS = 5;

    public function __construct(
        private PurchaseOrderRepositoryInterface $purchaseOrderRepository,
        private SupplierRepositoryInterface $supplierRepository,
    ) {
        parent::__construct($purchaseOrderRepository);
    }

    public function list(int $perPage = 15)
    {
        return $this->purchaseOrderRepository->paginateWithRelations($perPage);
    }

    public function getDetail(int $id)
    {
        return $this->purchaseOrderRepository->findWithRelations($id);
    }

    public function listForSupplier(int $supplierId, int $perPage = 15)
    {
        return $this->purchaseOrderRepository->paginateForSupplier($supplierId, $perPage);
    }

    /**
     * @param  array<int, array{item_type: 'supply'|'tool', item_id: int, quantity: float}>  $items
     */
    public function create(array $data): PurchaseOrder
    {
        $supplier = $this->supplierRepository->find($data['supplier_id']);

        if ($supplier->status !== Supplier::STATUS_ACTIVE) {
            throw new \DomainException("El proveedor '{$supplier->name}' está inactivo y no puede recibir órdenes.");
        }

        if ((float) $supplier->score < SupplierService::MINIMUM_SCORE_FOR_ORDERS) {
            throw new \DomainException(
                "No se puede generar la orden. El proveedor '{$supplier->name}' tiene una calificación insuficiente ({$supplier->score} / 5.00). Mínimo requerido: ".
                number_format(SupplierService::MINIMUM_SCORE_FOR_ORDERS, 2).'.'
            );
        }

        $items = collect($data['items'])->map(function (array $item) use ($supplier) {
            $relation = $item['item_type'] === 'tool' ? $supplier->tools() : $supplier->supplies();
            $catalogItem = $relation->whereKey($item['item_id'])->first();

            if (! $catalogItem) {
                throw new \DomainException('Cada ítem de la orden debe estar registrado en el catálogo del proveedor seleccionado.');
            }

            return [
                'supply_id' => $item['item_type'] === 'supply' ? $catalogItem->id : null,
                'tool_id' => $item['item_type'] === 'tool' ? $catalogItem->id : null,
                'item_sku' => $item['item_type'] === 'supply' ? $catalogItem->sku : 'HERR-'.$catalogItem->id,
                'item_name' => $catalogItem->name,
                'unit' => $item['item_type'] === 'supply' ? $catalogItem->unit : 'unidad',
                'quantity' => $item['quantity'],
                'unit_price' => $catalogItem->pivot->unit_price,
            ];
        })->all();
        $total = collect($items)->sum(fn ($item) => $item['quantity'] * $item['unit_price']);
        $estimatedDeliveryDate = $data['estimated_delivery_date']
            ?? Carbon::today()->addDays(self::DEFAULT_LEAD_TIME_DAYS)->toDateString();

        $order = DB::transaction(function () use ($supplier, $items, $total, $estimatedDeliveryDate, $data) {
            $order = $this->purchaseOrderRepository->create([
                'order_number' => $this->purchaseOrderRepository->nextOrderNumber(),
                'supplier_id' => $supplier->id,
                'created_by' => $data['created_by'] ?? null,
                'status' => PurchaseOrder::STATUS_ISSUED,
                'issued_at' => now(),
                'estimated_delivery_date' => $estimatedDeliveryDate,
                'total' => $total,
            ]);

            foreach ($items as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $order->id,
                    'supply_id' => $item['supply_id'],
                    'tool_id' => $item['tool_id'] ?? null,
                    'item_sku' => $item['item_sku'],
                    'item_name' => $item['item_name'],
                    'unit' => $item['unit'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);
            }

            return $order;
        });

        return $this->purchaseOrderRepository->findWithRelations($order->id);
    }

    public function receive(int $orderId, array $data): array
    {
        $order = $this->purchaseOrderRepository->findWithRelations($orderId);

        if ($order->status === PurchaseOrder::STATUS_RECEIVED) {
            throw new \DomainException('Esta orden de compra ya fue recibida anteriormente.');
        }

        $receipt = DB::transaction(function () use ($order, $data) {
            $receipt = PurchaseReceipt::create([
                'purchase_order_id' => $order->id,
                'received_by' => $data['received_by'] ?? null,
                'received_at' => now(),
                'quality_status' => $data['quality_status'],
                'observations' => $data['observations'] ?? null,
                'photo_evidence_url' => $data['photo_evidence_url'] ?? null,
            ]);

            $newStatus = $data['quality_status'] === PurchaseReceipt::QUALITY_REJECTED
                ? PurchaseOrder::STATUS_CANCELLED
                : PurchaseOrder::STATUS_RECEIVED;

            $this->purchaseOrderRepository->update($order->id, ['status' => $newStatus]);

            if ($data['quality_status'] !== PurchaseReceipt::QUALITY_REJECTED) {
                PurchaseOrderReceived::dispatch($order, $order->items);
            }

            return $receipt;
        });

        return [
            'receipt' => $receipt,
            'order' => $this->purchaseOrderRepository->findWithRelations($order->id),
        ];
    }

    /**
     * Ítems pendientes por llegar (órdenes 'issued'/'sent'), clasificados por urgencia
     * según la fecha de entrega estimada de su orden.
     */
    public function pendingDeliveries(): array
    {
        $today = Carbon::today();

        return $this->purchaseOrderRepository->findPendingItems()
            ->flatMap(function (PurchaseOrder $order) use ($today) {
                $deliveryDate = $order->estimated_delivery_date
                    ? Carbon::parse($order->estimated_delivery_date)
                    : null;

                $urgency = match (true) {
                    $deliveryDate === null => 'green',
                    $deliveryDate->lte($today) => 'red',
                    $deliveryDate->isSameDay($today->copy()->addDay()) => 'yellow',
                    default => 'green',
                };

                return $order->items->map(fn (PurchaseOrderItem $item) => [
                    'purchase_order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'estimated_delivery_date' => $order->estimated_delivery_date?->toDateString(),
                    'supplier_name' => $order->supplier->name,
                    'item_sku' => $item->item_sku,
                    'item_name' => $item->item_name,
                    'unit' => $item->unit,
                    'quantity' => $item->quantity,
                    'urgency' => $urgency,
                ]);
            })
            ->sortBy('estimated_delivery_date')
            ->values()
            ->all();
    }

    /**
     * Insumos y herramientas del inventario que nunca han aparecido en un ítem de
     * orden de compra, para avisar en el panel de Órdenes. Cada ítem lleva el ID
     * del proveedor (si existe alguno en su catálogo) que el frontend usa para
     * decidir si abre directamente "Nueva Orden" o pide vincular un catálogo.
     */
    public function unregisteredItems(): array
    {
        $supplies = Supply::query()
            ->whereDoesntHave('purchaseOrderItems')
            ->orderBy('name')
            ->get(['id', 'sku', 'name', 'unit'])
            ->map(fn ($supply) => [
                'item_type' => 'supply',
                'item_id' => $supply->id,
                'sku' => $supply->sku,
                'name' => $supply->name,
                'unit' => $supply->unit,
                'supplier_id' => $this->bestSupplierIdFor('supply', $supply->id),
            ]);

        $tools = Tool::query()
            ->whereDoesntHave('purchaseOrderItems')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($tool) => [
                'item_type' => 'tool',
                'item_id' => $tool->id,
                'sku' => null,
                'name' => $tool->name,
                'unit' => 'unidad',
                'supplier_id' => $this->bestSupplierIdFor('tool', $tool->id),
            ]);

        return $supplies->concat($tools)->sortBy('name')->values()->all();
    }

    /**
     * Entre los proveedores que ofrecen el ítem en su catálogo, prioriza uno
     * habilitado para recibir órdenes (activo + score >= mínimo); si ninguno lo
     * cumple, devuelve el de mejor score para que el frontend igual lo preseleccione
     * y muestre la advertencia existente del formulario de "Nueva Orden".
     */
    private function bestSupplierIdFor(string $itemType, int $itemId): ?int
    {
        $relationName = $itemType === 'tool' ? 'tools' : 'supplies';

        $suppliers = Supplier::query()
            ->whereHas($relationName, fn ($query) => $query->whereKey($itemId))
            ->get(['id', 'status', 'score']);

        if ($suppliers->isEmpty()) {
            return null;
        }

        $eligible = $suppliers->first(
            fn (Supplier $supplier) => $supplier->status === Supplier::STATUS_ACTIVE
                && (float) $supplier->score >= SupplierService::MINIMUM_SCORE_FOR_ORDERS
        );

        return ($eligible ?? $suppliers->sortByDesc('score')->first())->id;
    }
}
