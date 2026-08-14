<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Events\LotCreated;
use App\Modules\Planning\Events\LotDeleted;
use App\Modules\Planning\Events\LotUpdated;
use App\Modules\Planning\Models\Lot;
use App\Modules\Planning\Repositories\Contracts\LotRepositoryInterface;
use App\Modules\Shared\Services\BaseService;

/**
 * Reglas de negocio del Lote:
 * - La capacidad se calcula a partir de la geometría (ancho, largo, diámetro de funda,
 *   corredores) y nunca la digita el usuario al crear el lote.
 * - `calculated_capacity` es la base geométrica y nunca cambia tras la creación.
 * - `total_capacity` es el valor que usa el resto del sistema; puede corregirse a mano
 *   desde "ajustes" pero solo dentro de un margen de tolerancia sobre calculated_capacity.
 * - El estado "occupied" es exclusivamente automático (lo asigna LotCycleService al iniciar
 *   un ciclo) — nunca se asigna desde este Service.
 * - Un lote solo se puede inactivar si no está ocupado, y solo se puede eliminar si está
 *   inactivo.
 * - La duración de cada fase es una única configuración global (production_phases.
 *   estimated_duration_days) — no existe personalización por lote. Al iniciar un
 *   ciclo, LotCycleService lee esa configuración vigente en ese momento.
 */
class LotService extends BaseService
{
    /**
     * Margen de tolerancia permitido entre la capacidad calculada por geometría y una
     * corrección manual (conteo real en campo). Decisión de ingeniería documentada en
     * docs/03_MODULE_CONTRACTS/Planning.md — ajustable si el equipo define otro criterio.
     */
    private const CAPACITY_TOLERANCE = 0.15;

    public function __construct(
        private LotRepositoryInterface $lotRepository,
    ) {
        parent::__construct($lotRepository);
    }

    public function list(int $perPage = 15)
    {
        return $this->lotRepository->paginateOrderedByCode($perPage);
    }

    public function getDetail(int $id)
    {
        return $this->lotRepository->findWithCycles($id);
    }

    public function create(array $data)
    {
        if (empty($data['code'])) {
            $data['code'] = $this->lotRepository->generateUniqueCode();
        }

        $data['funda_diameter'] = $data['funda_diameter'] ?? 12;

        $capacity = $this->calculateCapacity(
            width: (float) $data['width'],
            length: (float) $data['length'],
            fundaDiameter: (float) $data['funda_diameter'],
            corridorCount: (int) ($data['corridor_count'] ?? 0),
            corridorWidthCm: (float) ($data['corridor_width'] ?? 0),
        );

        $data['calculated_capacity'] = $capacity;
        $data['total_capacity'] = $capacity;
        $data['current_status'] = Lot::STATUS_AVAILABLE;

        $lot = $this->lotRepository->create($data);
        event(new LotCreated($lot->id));

        return $this->lotRepository->findWithCycles($lot->id);
    }

    public function update($id, array $data)
    {
        parent::update($id, $data);
        event(new LotUpdated($id));

        return $this->lotRepository->findWithCycles($id);
    }

    /**
     * Calcula cuántas plántulas del diámetro dado entran en el lote, descontando el
     * ancho que ocupan los corredores (siempre paralelos al largo).
     */
    public function calculateCapacity(
        float $width,
        float $length,
        float $fundaDiameter,
        int $corridorCount,
        float $corridorWidthCm,
    ): int {
        $corridorWidthM = $corridorWidthCm / 100;
        $plantableWidth = $width - ($corridorCount * $corridorWidthM);

        if ($plantableWidth <= 0) {
            throw new \DomainException('Los corredores ocupan más ancho del que tiene el lote disponible.');
        }

        $diameterM = $fundaDiameter / 100;
        $plantsAcrossWidth = (int) floor($plantableWidth / $diameterM);
        $rowsAlongLength = (int) floor($length / $diameterM);

        return max(0, $plantsAcrossWidth * $rowsAlongLength);
    }

    public function updateCapacity(int $id, int $newCapacity)
    {
        $lot = $this->lotRepository->find($id);

        $tolerance = (int) round($lot->calculated_capacity * self::CAPACITY_TOLERANCE);
        $min = $lot->calculated_capacity - $tolerance;
        $max = $lot->calculated_capacity + $tolerance;

        if ($newCapacity < $min || $newCapacity > $max) {
            throw new \DomainException(
                "La cantidad corregida debe estar entre {$min} y {$max} plántulas (máximo 15% de diferencia respecto al cálculo por geometría: {$lot->calculated_capacity})."
            );
        }

        $this->lotRepository->update($id, ['total_capacity' => $newCapacity]);
        event(new LotUpdated($id));

        return $this->lotRepository->findWithCycles($id);
    }

    public function updateStatus(int $id, string $status)
    {
        $lot = $this->lotRepository->find($id);

        if ($status === Lot::STATUS_OCCUPIED) {
            throw new \DomainException('El estado "Ocupado" lo asigna automáticamente el sistema al iniciar un ciclo en el lote.');
        }

        if ($status === Lot::STATUS_INACTIVE && $lot->current_status === Lot::STATUS_OCCUPIED) {
            throw new \DomainException('No se puede inactivar un lote que está en producción.');
        }

        $this->lotRepository->update($id, ['current_status' => $status]);
        event(new LotUpdated($id));

        return $this->lotRepository->findWithCycles($id);
    }

    public function updatePosition(int $id, float $x, float $y)
    {
        $lot = $this->lotRepository->update($id, ['position_x' => $x, 'position_y' => $y]);
        event(new LotUpdated($id));

        return $lot;
    }

    public function delete($id)
    {
        $lot = $this->lotRepository->find($id);

        if ($lot->current_status !== Lot::STATUS_INACTIVE) {
            throw new \DomainException('Solo se puede eliminar un lote que esté inactivo.');
        }

        $deleted = $this->lotRepository->delete($id);

        if ($deleted) {
            event(new LotDeleted($id));
        }

        return $deleted;
    }
}
