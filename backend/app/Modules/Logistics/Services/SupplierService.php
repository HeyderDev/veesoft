<?php

namespace App\Modules\Logistics\Services;

use App\Modules\Logistics\Models\PurchaseOrder;
use App\Modules\Logistics\Models\Supplier;
use App\Modules\Logistics\Models\SupplierEvaluation;
use App\Modules\Logistics\Repositories\Contracts\SupplierRepositoryInterface;
use App\Modules\Logistics\Traits\ValidatesEcuadorianTaxId;
use App\Modules\Shared\Services\BaseService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Arr;
use Carbon\Carbon;

/**
 * Reglas de negocio de Proveedor:
 * - El RUC/CI se valida con el algoritmo oficial de Ecuador (Módulo 10/11) al crear o al
 *   cambiar el RUC/CI de un proveedor existente, y debe ser único.
 * - El score (0.00-5.00) nunca lo asigna el usuario: es siempre el promedio ponderado de
 *   sus evaluaciones (calidad 40% + puntualidad 30% + precio 20% + servicio postventa
 *   10% — "cumplimiento" se guarda pero no participa de la fórmula, igual que en el
 *   sistema anterior). Este Service recalcula el score dentro de una transacción cada
 *   vez que se registra una evaluación nueva — en el sistema anterior esto lo hacía un
 *   trigger de PostgreSQL; aquí no hay motor de base de datos que lo haga por nosotros.
 */
class SupplierService extends BaseService
{
    use ValidatesEcuadorianTaxId;

    private const QUALITY_WEIGHT = 0.40;

    private const PUNCTUALITY_WEIGHT = 0.30;

    private const PRICE_WEIGHT = 0.20;

    private const AFTER_SALES_WEIGHT = 0.10;

    public const MINIMUM_SCORE_FOR_ORDERS = 3.00;

    public const MAXIMUM_SCORE = 5.00;

    public function __construct(
        private SupplierRepositoryInterface $supplierRepository,
    ) {
        parent::__construct($supplierRepository);
    }

    public function list(int $perPage = 15)
    {
        return $this->supplierRepository->paginateOrderedByScore($perPage);
    }

    public function getDetail(int $id)
    {
        return $this->supplierRepository->findWithRelations($id);
    }

    public function create(array $data)
    {
        $this->assertValidTaxId($data['tax_id']);

        $certification = Arr::pull($data, 'certification', []);
        if (isset($certification['expires_at'])) {
            $data['certificate_expires_at'] = $certification['expires_at'];
        }

        $data['status'] = $data['status'] ?? Supplier::STATUS_ACTIVE;
        $data['score'] = self::MAXIMUM_SCORE;

        $supplier = DB::transaction(function () use ($data, $certification) {
            $supplier = $this->supplierRepository->create($data);
            $this->saveCertification($supplier, $certification, (bool) ($data['organic_certified'] ?? false));

            return $supplier;
        });

        return $this->supplierRepository->findWithRelations($supplier->id);
    }

    public function update($id, array $data)
    {
        if (! empty($data['tax_id'])) {
            $this->assertValidTaxId($data['tax_id'], excludingId: $id);
        }

        $certification = Arr::pull($data, 'certification', []);
        if (isset($certification['expires_at'])) {
            $data['certificate_expires_at'] = $certification['expires_at'];
        }

        DB::transaction(function () use ($id, $data, $certification) {
            parent::update($id, $data);
            if ($certification || array_key_exists('organic_certified', $data)) {
                $supplier = $this->supplierRepository->find($id);
                $this->saveCertification($supplier, $certification, (bool) $supplier->organic_certified);
            }
        });

        return $this->supplierRepository->findWithRelations($id);
    }

    private function saveCertification(Supplier $supplier, array $data, bool $hasCertificate): void
    {
        $certification = $supplier->certification()->firstOrNew();
        $filePath = $certification->file_path;

        if (isset($data['file'])) {
            if ($filePath) {
                Storage::disk('public')->delete($filePath);
            }
            $filePath = $data['file']->store('supplier-certificates', 'public');
        }

        $certification->fill([
            'has_certificate' => $hasCertificate,
            'certificate_number' => $data['certificate_number'] ?? $certification->certificate_number,
            'certifying_entity' => $data['certifying_entity'] ?? $certification->certifying_entity,
            'issued_at' => $data['issued_at'] ?? $certification->issued_at,
            'expires_at' => $data['expires_at'] ?? $supplier->certificate_expires_at,
            'file_path' => $filePath,
            'registered_at' => $certification->registered_at ?? now(),
        ]);
        $supplier->certification()->save($certification);
    }

    private function assertValidTaxId(string $taxId, ?int $excludingId = null): void
    {
        if (! $this->isValidEcuadorianTaxId($taxId)) {
            throw new \DomainException('El RUC/CI proporcionado no es válido para la República del Ecuador.');
        }

        if ($this->supplierRepository->existsWithTaxId($taxId, $excludingId)) {
            throw new \DomainException('Ya existe un proveedor registrado con ese RUC/CI.');
        }
    }

    /**
     * Registra una evaluación (HU-03) y recalcula el score del proveedor.
     */
    public function evaluate(int $supplierId, array $data): Supplier
    {
        $supplier = $this->supplierRepository->find($supplierId);

        DB::transaction(function () use ($supplier, $data) {
            SupplierEvaluation::create([
                'supplier_id' => $supplier->id,
                'evaluated_by' => $data['evaluated_by'] ?? null,
                'compliance' => $data['compliance'],
                'quality' => $data['quality'],
                'punctuality' => $data['punctuality'],
                'price' => $data['price'],
                'after_sales_service' => $data['after_sales_service'],
                'comment' => $data['comment'] ?? null,
            ]);

            $this->recalculateScore($supplier);
        });

        return $this->supplierRepository->findWithRelations($supplier->id);
    }

    private function recalculateScore(Supplier $supplier): void
    {
        $averages = $supplier->evaluations()
            ->selectRaw('AVG(quality) as avg_quality, AVG(punctuality) as avg_punctuality, AVG(price) as avg_price, AVG(after_sales_service) as avg_after_sales')
            ->first();

        $score = ($averages->avg_quality * self::QUALITY_WEIGHT)
            + ($averages->avg_punctuality * self::PUNCTUALITY_WEIGHT)
            + ($averages->avg_price * self::PRICE_WEIGHT)
            + ($averages->avg_after_sales * self::AFTER_SALES_WEIGHT);

        $this->supplierRepository->update($supplier->id, ['score' => round($score, 2)]);
    }

    /**
     * API pública consumida por otros módulos (ver docs/03_MODULE_CONTRACTS/Logistics.md):
     * proveedor mejor calificado que históricamente ha suministrado un ítem dado.
     */
    public function getSupplierByItem(string $itemSku): ?Supplier
    {
        return $this->supplierRepository->findBestForItemSku($itemSku);
    }

    public function catalog(int $supplierId)
    {
        $supplier = $this->supplierRepository->find($supplierId);

        $supplies = $supplier->supplies()->orderBy('name')->get()->map(fn ($supply) => [
            'item_type' => 'supply',
            'item_id' => $supply->id,
            'code' => $supply->sku,
            'name' => $supply->name,
            'unit' => $supply->unit,
            'unit_price' => $supply->pivot->unit_price,
        ]);
        $tools = $supplier->tools()->orderBy('name')->get()->map(fn ($tool) => [
            'item_type' => 'tool',
            'item_id' => $tool->id,
            'code' => 'HERR-'.$tool->id,
            'name' => $tool->name,
            'unit' => 'unidad',
            'unit_price' => $tool->pivot->unit_price,
        ]);

        return $supplies->concat($tools)->sortBy('name')->values();
    }

    /** @param array<int, array{item_type: 'supply'|'tool', item_id: int, unit_price: float}> $items */
    public function syncCatalog(int $supplierId, array $items)
    {
        $supplier = $this->supplierRepository->find($supplierId);

        $supplies = collect($items)->where('item_type', 'supply')->mapWithKeys(fn (array $item) => [
            $item['item_id'] => ['unit_price' => $item['unit_price']],
        ])->all();
        $tools = collect($items)->where('item_type', 'tool')->mapWithKeys(fn (array $item) => [
            $item['item_id'] => ['unit_price' => $item['unit_price']],
        ])->all();

        // Los queries usan el scope del vivero activo y evitan asociar ítems ajenos.
        \App\Modules\Inventory\Models\Supply::query()->whereIn('id', array_keys($supplies))->count() === count($supplies)
            || throw new \DomainException('Uno de los insumos no pertenece al vivero activo.');
        \App\Modules\Inventory\Models\Tool::query()->whereIn('id', array_keys($tools))->count() === count($tools)
            || throw new \DomainException('Una de las herramientas no pertenece al vivero activo.');

        $supplier->supplies()->sync($supplies);
        $supplier->tools()->sync($tools);

        return $this->catalog($supplierId);
    }

    public function certificateAlerts(int $days = 30)
    {
        $today = Carbon::today();
        $deadline = $today->copy()->addDays($days);

        return Supplier::query()
            ->where('organic_certified', true)
            ->whereNotNull('certificate_expires_at')
            ->whereDate('certificate_expires_at', '<=', $deadline)
            ->orderBy('certificate_expires_at')
            ->get()
            ->map(function (Supplier $supplier) use ($today) {
                $expiresAt = Carbon::parse($supplier->certificate_expires_at);

                return [
                    'supplier_id' => $supplier->id,
                    'supplier_name' => $supplier->name,
                    'certificate_expires_at' => $expiresAt->toDateString(),
                    'status' => $expiresAt->lt($today) ? 'expired' : 'due_soon',
                    'days_remaining' => $today->diffInDays($expiresAt, false),
                ];
            })
            ->values();
    }

    /**
     * Reporte de proveedores: cuántos hay registrados y cuánto se le ha comprado a cada
     * uno históricamente (no acotado a ningún período, a diferencia de
     * `PurchaseOrderService::spendReport()`, que sí se acota a un rango de fechas).
     * Solo cuenta como "gasto real" las órdenes recibidas con calidad aprobada o condicional.
     */
    public function spendSummary(): array
    {
        $spendFilter = fn ($query) => $query
            ->where('status', PurchaseOrder::STATUS_RECEIVED)
            ->whereHas('receipt', fn ($receipt) => $receipt->whereIn('quality_status', [
                \App\Modules\Logistics\Models\PurchaseReceipt::QUALITY_APPROVED,
                \App\Modules\Logistics\Models\PurchaseReceipt::QUALITY_CONDITIONAL,
            ]));

        $suppliers = Supplier::query()
            ->withSum(['purchaseOrders as total_spent' => $spendFilter], 'total')
            ->withCount(['purchaseOrders as orders_count' => $spendFilter])
            ->orderByDesc('total_spent')
            ->get();

        return [
            'total_suppliers' => $suppliers->count(),
            'suppliers' => $suppliers->map(fn (Supplier $supplier) => [
                'supplier_id' => $supplier->id,
                'supplier_name' => $supplier->name,
                'status' => $supplier->status,
                'orders_count' => (int) $supplier->orders_count,
                'total_spent' => number_format((float) ($supplier->total_spent ?? 0), 2, '.', ''),
            ])->values()->all(),
        ];
    }
}
