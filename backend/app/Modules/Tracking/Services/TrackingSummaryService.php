<?php

namespace App\Modules\Tracking\Services;

use App\Modules\Tracking\Repositories\Contracts\TrackingItemRepositoryInterface;

/**
 * Agrega datos de TrackingItem para la pantalla de Resumen (totales y distribución
 * por etapa) y las alertas de stock bajo — no posee su propia tabla, por eso no
 * extiende BaseService.
 */
class TrackingSummaryService
{
    public function __construct(
        private TrackingItemRepositoryInterface $itemRepository,
    ) {}

    public function getSummary(): array
    {
        $items = $this->itemRepository->all();

        $byStage = $items->groupBy('stage')->map(fn ($group) => [
            'items_count' => $group->count(),
            'quantity' => (int) $group->sum('quantity'),
        ]);

        return [
            'total_items' => $items->count(),
            'total_quantity' => (int) $items->sum('quantity'),
            'by_stage' => $byStage,
        ];
    }

    public function getStockAlerts()
    {
        return $this->itemRepository->allBelowMinimumStock();
    }
}
