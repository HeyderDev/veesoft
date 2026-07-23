<?php

namespace App\Modules\Planning\Services;

use App\Modules\Planning\Repositories\Contracts\ProductionPhaseRepositoryInterface;
use App\Modules\Shared\Services\BaseService;

/**
 * La duración de cada fase es una configuración PROPIA DE CADA VIVERO (no hay
 * personalización por lote dentro de un mismo vivero). Cambiarla reprograma
 * automáticamente todos los lotes de ese vivero con un ciclo en curso, desde la fase
 * en la que cada uno se encuentra actualmente en adelante — ver
 * LotCycleService::resyncActiveCyclesForPhaseChange().
 */
class ProductionPhaseService extends BaseService
{
    /**
     * Set de fases por defecto que recibe todo vivero nuevo (ver seedDefaultsForVivero()).
     */
    private const DEFAULT_PHASES = [
        [
            'code' => 'PREP',
            'name' => 'Preparación',
            'description' => 'Preparación del sustrato y llenado de fundas.',
            'execution_order' => 1,
            'estimated_duration_days' => 7,
            'color_reference' => '#d97706', // Ámbar
        ],
        [
            'code' => 'SIEM',
            'name' => 'Siembra',
            'description' => 'Siembra de la semilla en las fundas preparadas.',
            'execution_order' => 2,
            'estimated_duration_days' => 3,
            'color_reference' => '#65a30d', // Lima
        ],
        [
            'code' => 'CREC_INI',
            'name' => 'Crecimiento Inicial',
            'description' => 'Periodo de germinación y primer crecimiento del patrón.',
            'execution_order' => 3,
            'estimated_duration_days' => 30,
            'color_reference' => '#16a34a', // Verde
        ],
        [
            'code' => 'INJER',
            'name' => 'Injertación',
            'description' => 'Proceso de injerto sobre el patrón desarrollado.',
            'execution_order' => 4,
            'estimated_duration_days' => 15,
            'color_reference' => '#0284c7', // Azul claro
        ],
        [
            'code' => 'DESA',
            'name' => 'Desarrollo',
            'description' => 'Desarrollo de la planta injertada hasta su punto de venta.',
            'execution_order' => 5,
            'estimated_duration_days' => 60,
            'color_reference' => '#4338ca', // Índigo
        ],
        [
            'code' => 'DESP',
            'name' => 'Despacho',
            'description' => 'Periodo de preparación y salida de las plantas.',
            'execution_order' => 6,
            'estimated_duration_days' => 5,
            'color_reference' => '#be123c', // Rosa/Rojo oscuro
        ],
    ];

    public function __construct(
        private ProductionPhaseRepositoryInterface $phaseRepository,
        private LotCycleService $lotCycleService,
    ) {
        parent::__construct($phaseRepository);
    }

    public function listAll()
    {
        return $this->phaseRepository->allOrderedByExecution();
    }

    /**
     * Crea el set de fases por defecto para un vivero recién creado
     * (ver ViveroService::create()).
     */
    public function seedDefaultsForVivero(int $viveroId): void
    {
        foreach (self::DEFAULT_PHASES as $phase) {
            $this->phaseRepository->create(['vivero_id' => $viveroId, ...$phase]);
        }
    }

    public function update($id, array $data)
    {
        $existing = $this->phaseRepository->find($id);

        if ($existing->code === 'DESP' && array_key_exists('estimated_duration_days', $data)) {
            throw new \DomainException('La fase de Despacho no tiene una duración configurable — termina cuando se registra el despacho del lote.');
        }

        $phase = parent::update($id, $data);

        $this->lotCycleService->resyncActiveCyclesForPhaseChange($phase->vivero_id);

        return $phase;
    }
}
