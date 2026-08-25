<?php

namespace App\Modules\Logistics\Services;

use App\Modules\Inventory\Models\Supply;
use App\Modules\Inventory\Models\Tool;
use App\Modules\Inventory\Models\ToolUnit;
use App\Modules\Inventory\Models\Movement;
use App\Modules\Inventory\Services\PurchaseReceiptInventoryService;
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
 * - Solo se puede emitir una orden a un proveedor 'active'. El score bajo (< 3.00, ver
 *   SupplierService::MINIMUM_SCORE_FOR_ORDERS) ya no bloquea la compra — 2026-08-24, a
 *   pedido del negocio: basta con la advertencia visual que ya muestra el frontend al
 *   elegir un proveedor con score insuficiente, no hace falta impedir la orden.
 * - Sin fecha de entrega estimada, se asume hoy + 5 días (igual que el sistema anterior).
 * - El total es la suma de cantidad × precio_unitario de cada ítem.
 * - Una orden solo puede recibirse una vez.
 * - Recibir con calidad 'approved'/'conditional' dispara PurchaseOrderReceived (para que
 *   Inventory actualice stock cuando ese módulo exista); con 'rejected', la orden pasa a
 *   'cancelled'; en cualquier otro caso pasa a 'received'.
 * - El listado de pendientes clasifica cada ítem por urgencia según la fecha de entrega
 *   estimada de su orden: 'red' si ya venció, 'yellow' si es mañana, 'green' en otro caso.
 * - El reporte de gasto (`spendReport`/`annualSpendReport`) solo cuenta como "gasto real"
 *   las órdenes que no terminaron `cancelled` (no existe un flujo real que deje una orden
 *   en `draft`: `create()` siempre las emite `issued` con `issued_at = now()`, ver arriba).
 *   El rango de fechas lo decide quien llama: puede ser un año completo o el período de
 *   una Meta de Producción de `Planning` — este Service no conoce ese módulo (ver
 *   docs/03_MODULE_CONTRACTS/Logistics.md §8), el frontend resuelve las fechas.
 */
class PurchaseOrderService extends BaseService
{
    private const DEFAULT_LEAD_TIME_DAYS = 5;

    public function __construct(
        private PurchaseOrderRepositoryInterface $purchaseOrderRepository,
        private SupplierRepositoryInterface $supplierRepository,
        private PurchaseReceiptInventoryService $purchaseReceiptInventoryService,
    ) {
        parent::__construct($purchaseOrderRepository);
    }

    public function list(int $perPage = 20)
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
     * @param  array<int, array{item_type: 'supply'|'tool', item_id: int, quantity: float, unit_price?: float}>  $items
     */
    public function create(array $data): PurchaseOrder
    {
        $supplier = isset($data['supplier_id']) ? $this->supplierRepository->find($data['supplier_id']) : null;

        if ($supplier && $supplier->status !== Supplier::STATUS_ACTIVE) {
            throw new \DomainException("El proveedor '{$supplier->name}' está inactivo y no puede recibir órdenes.");
        }

        $items = collect($data['items'])->map(function (array $item) use ($supplier) {
            if ($item['item_type'] === 'tool' && floor((float) $item['quantity']) !== (float) $item['quantity']) {
                throw new \DomainException('Las herramientas deben solicitarse en unidades enteras.');
            }

            if ($supplier) {
                $relation = $item['item_type'] === 'tool' ? $supplier->tools() : $supplier->supplies();
                $catalogItem = $relation->whereKey($item['item_id'])->first();

                if (! $catalogItem) {
                    throw new \DomainException('Cada ítem de la orden debe estar registrado en el catálogo del proveedor seleccionado.');
                }
                $unitPrice = (float) $catalogItem->pivot->unit_price;
            } else {
                $catalogItem = $item['item_type'] === 'tool'
                    ? Tool::query()->findOrFail($item['item_id'])
                    : Supply::query()->findOrFail($item['item_id']);

                if (! array_key_exists('unit_price', $item) || $item['unit_price'] === null) {
                    throw new \DomainException('Indica el precio unitario de cada ítem cuando la compra no tiene proveedor.');
                }
                $unitPrice = (float) $item['unit_price'];
            }

            return [
                'supply_id' => $item['item_type'] === 'supply' ? $catalogItem->id : null,
                'tool_id' => $item['item_type'] === 'tool' ? $catalogItem->id : null,
                'item_sku' => $item['item_type'] === 'supply' ? $catalogItem->sku : 'HERR-'.$catalogItem->id,
                'item_name' => $catalogItem->name,
                'unit' => $item['item_type'] === 'supply' ? $catalogItem->unit : 'unidad',
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
            ];
        })->all();
        $total = collect($items)->sum(fn ($item) => $item['quantity'] * $item['unit_price']);
        $estimatedDeliveryDate = $data['estimated_delivery_date']
            ?? Carbon::today()->addDays(self::DEFAULT_LEAD_TIME_DAYS)->toDateString();

        $reconcilesExistingInventory = (bool) ($data['reconciles_existing_inventory'] ?? false);

        $order = DB::transaction(function () use ($supplier, $items, $total, $estimatedDeliveryDate, $data, $reconcilesExistingInventory) {
            $issuedAt = $reconcilesExistingInventory
                ? Carbon::parse($estimatedDeliveryDate)->startOfDay()
                : now();
            $order = $this->purchaseOrderRepository->create([
                'order_number' => $this->purchaseOrderRepository->nextOrderNumber(),
                'supplier_id' => $supplier?->id,
                'created_by' => $data['created_by'] ?? null,
                'status' => PurchaseOrder::STATUS_ISSUED,
                'issued_at' => $issuedAt,
                'estimated_delivery_date' => $estimatedDeliveryDate,
                'total' => $total,
                'reconciles_existing_inventory' => $reconcilesExistingInventory,
            ]);

            foreach ($items as $item) {
                $purchaseOrderItem = PurchaseOrderItem::create([
                    'purchase_order_id' => $order->id,
                    'supply_id' => $item['supply_id'],
                    'tool_id' => $item['tool_id'] ?? null,
                    'item_sku' => $item['item_sku'],
                    'item_name' => $item['item_name'],
                    'unit' => $item['unit'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);

                // Una unidad creada manualmente ya existe físicamente en Inventory, pero
                // todavía no tiene respaldo de compra. Al registrar la orden que la
                // reconcilia, se vincula aquí para que desaparezca del aviso de pendientes.
                if ($reconcilesExistingInventory && $purchaseOrderItem->tool_id) {
                    ToolUnit::query()
                        ->where('tool_id', $purchaseOrderItem->tool_id)
                        ->whereNull('purchase_order_item_id')
                        ->orderBy('id')
                        ->limit((int) $purchaseOrderItem->quantity)
                        ->update(['purchase_order_item_id' => $purchaseOrderItem->id]);
                }

                if ($reconcilesExistingInventory && $purchaseOrderItem->supply_id) {
                    Movement::query()
                        ->where('supply_id', $purchaseOrderItem->supply_id)
                        ->whereNull('purchase_order_item_id')
                        ->where('requires_purchase_registration', true)
                        ->update([
                            'purchase_order_item_id' => $purchaseOrderItem->id,
                            'requires_purchase_registration' => false,
                        ]);
                }
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

            // Las órdenes generadas desde el aviso documentan recursos que ya fueron
            // ingresados manualmente a Inventario; recibirlas no debe duplicar stock.
            if ($data['quality_status'] !== PurchaseReceipt::QUALITY_REJECTED && ! $order->reconciles_existing_inventory) {
                $this->purchaseReceiptInventoryService->apply($order, $order->items, $data['received_by'] ?? null);
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
    public function pendingDeliveries(int $limit = 12): array
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
                    'supplier_name' => $order->supplier?->name ?? 'Sin proveedor',
                    'item_sku' => $item->item_sku,
                    'item_name' => $item->item_name,
                    'unit' => $item->unit,
                    'quantity' => $item->quantity,
                    'urgency' => $urgency,
                ]);
            })
            ->sortBy('estimated_delivery_date')
            ->take($limit)
            ->values()
            ->all();
    }

    /** Ítems existentes que pueden comprarse sin asociarlos a un proveedor registrado. */
    public function availableInventoryItems(): array
    {
        $supplies = Supply::query()->orderBy('name')->get()->map(fn (Supply $supply) => [
            'item_type' => 'supply', 'item_id' => $supply->id, 'code' => $supply->sku,
            'name' => $supply->name, 'unit' => $supply->unit, 'unit_price' => '0.00',
        ]);
        $tools = Tool::query()->orderBy('name')->get()->map(fn (Tool $tool) => [
            'item_type' => 'tool', 'item_id' => $tool->id, 'code' => 'HERR-'.$tool->id,
            'name' => $tool->name, 'unit' => 'unidad', 'unit_price' => '0.00',
        ]);

        return $supplies->concat($tools)->sortBy('name')->values()->all();
    }

    /**
     * Insumos y herramientas del inventario cuya entrada/unidad aún no está vinculada
     * a una orden de compra, para avisar en el panel de Órdenes. Cada ítem lleva el ID
     * del proveedor (si existe alguno en su catálogo) que el frontend usa para
     * decidir si abre directamente "Nueva Orden" o pide vincular un catálogo, y la
     * `quantity` ya registrada en Inventory: la orden que reconcilia este aviso debe
     * emitirse por esa misma cantidad exacta (no editable en el frontend), para que
     * lo comprado cuadre con lo que ya está físicamente en inventario.
     */
    public function unregisteredItems(): array
    {
        $supplies = Supply::query()
            ->withSum([
                'movements as unregistered_quantity' => fn ($query) => $query
                    ->whereNull('purchase_order_item_id')
                    ->where('requires_purchase_registration', true),
            ], 'quantity')
            ->withMin([
                'movements as inventory_registered_at' => fn ($query) => $query
                    ->whereNull('purchase_order_item_id')
                    ->where('requires_purchase_registration', true),
            ], 'created_at')
            ->having('unregistered_quantity', '>', 0)
            ->orderBy('name')
            ->get(['id', 'sku', 'name', 'unit', 'current_stock'])
            ->map(fn ($supply) => [
                'item_type' => 'supply',
                'item_id' => $supply->id,
                'sku' => $supply->sku,
                'name' => $supply->name,
                'unit' => $supply->unit,
                // No se alerta por más de lo que aún existe físicamente: si una parte
                // de la entrada manual ya se utilizó, la cantidad pendiente se limita
                // al stock actual del insumo.
                'quantity' => (string) min((float) $supply->current_stock, (float) $supply->unregistered_quantity),
                'supplier_id' => $this->bestSupplierIdFor('supply', $supply->id),
                'registered_at' => $supply->inventory_registered_at ? Carbon::parse($supply->inventory_registered_at)->toDateString() : null,
            ])
            ->filter(fn (array $supply) => (float) $supply['quantity'] > 0)
            ->values();

        $tools = Tool::query()
            ->withCount([
                'units as unregistered_units_count' => fn ($query) => $query->whereNull('purchase_order_item_id'),
            ])
            ->withMin([
                'units as inventory_registered_at' => fn ($query) => $query->whereNull('purchase_order_item_id'),
            ], 'created_at')
            ->having('unregistered_units_count', '>', 0)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($tool) => [
                'item_type' => 'tool',
                'item_id' => $tool->id,
                'sku' => null,
                'name' => $tool->name,
                'unit' => 'unidad',
                'quantity' => (string) $tool->unregistered_units_count,
                'supplier_id' => $this->bestSupplierIdFor('tool', $tool->id),
                'registered_at' => $tool->inventory_registered_at ? Carbon::parse($tool->inventory_registered_at)->toDateString() : null,
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

    /**
     * Reporte de gasto en compras para un rango de fechas arbitrario, con desglose por
     * proveedor. Alimenta tanto el reporte anual como el de una Meta de Producción de
     * Planning (el frontend resuelve el rango a partir de `created_at`/`finished_at` de
     * la meta elegida y llama aquí con esas fechas — ver `spendReport()` del controlador).
     */
    public function spendReport(Carbon $start, Carbon $end, string $label): array
    {
        $ordersQuery = PurchaseOrder::query()
            ->where('purchase_orders.status', PurchaseOrder::STATUS_RECEIVED)
            ->whereHas('receipt', fn ($query) => $query->whereIn('quality_status', [
                PurchaseReceipt::QUALITY_APPROVED,
                PurchaseReceipt::QUALITY_CONDITIONAL,
            ]))
            ->whereBetween('purchase_orders.issued_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);

        $totalSpent = (float) (clone $ordersQuery)->sum('purchase_orders.total');
        $ordersCount = (clone $ordersQuery)->count();

        $suppliers = (clone $ordersQuery)
            ->leftJoin('suppliers', 'suppliers.id', '=', 'purchase_orders.supplier_id')
            ->selectRaw("COALESCE(suppliers.id, 0) as supplier_id, COALESCE(suppliers.name, 'Sin proveedor') as supplier_name, COUNT(*) as orders_count, SUM(purchase_orders.total) as total_spent")
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('total_spent')
            ->get()
            ->map(fn ($row) => [
                'supplier_id' => (int) $row->supplier_id,
                'supplier_name' => $row->supplier_name,
                'orders_count' => (int) $row->orders_count,
                'total_spent' => number_format((float) $row->total_spent, 2, '.', ''),
            ])
            ->values()
            ->all();

        return [
            'label' => $label,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'total_spent' => number_format($totalSpent, 2, '.', ''),
            'orders_count' => $ordersCount,
            'suppliers' => $suppliers,
        ];
    }

    public function annualSpendReport(int $year): array
    {
        return $this->spendReport(
            Carbon::create($year, 1, 1),
            Carbon::create($year, 12, 31),
            "Año {$year}",
        );
    }
}
