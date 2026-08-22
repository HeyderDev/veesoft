<?php

namespace App\Modules\Logistics\Services;

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

    public function nextOrderNumber(): string
    {
        return $this->purchaseOrderRepository->nextOrderNumber();
    }

    /**
     * @param  array<int, array{item_sku?: string, item_name: string, unit: string, quantity: float, unit_price: float}>  $items
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

        $items = $data['items'];
        $total = collect($items)->sum(fn ($item) => $item['quantity'] * $item['unit_price']);
        $estimatedDeliveryDate = $data['estimated_delivery_date']
            ?? Carbon::today()->addDays(self::DEFAULT_LEAD_TIME_DAYS)->toDateString();
        $orderNumber = $data['order_number'] ?? '';

        $order = DB::transaction(function () use ($orderNumber, $supplier, $items, $total, $estimatedDeliveryDate, $data) {
            $order = $this->purchaseOrderRepository->create([
                'order_number' => $orderNumber !== '' ? $orderNumber : $this->purchaseOrderRepository->nextOrderNumber(),
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
                    'item_sku' => ! empty($item['item_sku']) ? $item['item_sku'] : $this->generateItemSku(),
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

    /**
     * SKU autogenerado para ítems sin uno propio (mismo patrón que
     * Inventory\Repositories\Eloquent\SupplyRepository::generateUniqueSku()).
     */
    private function generateItemSku(): string
    {
        $maxId = PurchaseOrderItem::max('id') ?? 0;

        return 'OC-ITEM-'.str_pad($maxId + 1, 4, '0', STR_PAD_LEFT);
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
                'substrate_temperature' => $data['substrate_temperature'] ?? null,
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

        $temperature = $data['substrate_temperature'] ?? null;
        $temperatureWarning = null;
        if ($temperature !== null && ((float) $temperature < 18 || (float) $temperature > 24)) {
            $temperatureWarning = "Advertencia: la temperatura del sustrato registrada ({$temperature}°C) está fuera del rango óptimo recomendado (18-24°C).";
        }

        return [
            'receipt' => $receipt,
            'order' => $this->purchaseOrderRepository->findWithRelations($order->id),
            'temperature_warning' => $temperatureWarning,
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
                    'estimated_delivery_date' => $order->estimated_delivery_date,
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
}
