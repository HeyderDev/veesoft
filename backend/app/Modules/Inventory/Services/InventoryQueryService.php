<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Supply;
use App\Modules\Inventory\Models\Tool;
use Illuminate\Database\Eloquent\Collection;

/**
 * Servicio de consulta pública expuesto por el módulo Inventory.
 * Otros módulos (ej: Tasks) consumen este servicio para obtener
 * listados de recursos disponibles — nunca acceden al repositorio directo.
 */
class InventoryQueryService
{
    public function getAvailableTools(): Collection
    {
        return Tool::where('status', Tool::STATUS_AVAILABLE)
            ->select('id', 'code', 'name', 'description', 'quantity')
            ->orderBy('name')
            ->get();
    }

    public function getAvailableSupplies(): Collection
    {
        return Supply::where('current_stock', '>', 0)
            ->select('id', 'sku', 'name', 'unit', 'current_stock')
            ->orderBy('name')
            ->get();
    }

    public function getAvailableResources(): array
    {
        return [
            'tools' => $this->getAvailableTools(),
            'supplies' => $this->getAvailableSupplies(),
        ];
    }
}
