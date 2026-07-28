<?php

namespace App\Modules\Logistics\Services;

use App\Modules\Logistics\Models\Supplier;
use App\Modules\Logistics\Models\SupplierEvaluation;
use App\Modules\Logistics\Repositories\Contracts\SupplierRepositoryInterface;
use App\Modules\Logistics\Traits\ValidatesEcuadorianTaxId;
use App\Modules\Shared\Services\BaseService;
use Illuminate\Support\Facades\DB;

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

        $data['status'] = $data['status'] ?? Supplier::STATUS_ACTIVE;
        $data['score'] = self::MAXIMUM_SCORE;

        $supplier = $this->supplierRepository->create($data);

        return $this->supplierRepository->findWithRelations($supplier->id);
    }

    public function update($id, array $data)
    {
        if (! empty($data['tax_id'])) {
            $this->assertValidTaxId($data['tax_id'], excludingId: $id);
        }

        parent::update($id, $data);

        return $this->supplierRepository->findWithRelations($id);
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
}
