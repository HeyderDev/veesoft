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
    public function getAvailableTools()
    {
        $viveroId = app(\App\Modules\Shared\Support\CurrentVivero::class)->id();
        
        $query = Tool::query();
        if ($viveroId) {
            $query->where('vivero_id', $viveroId);
        }

        return $query->whereHas('units', function ($q) {
                $q->where('status', 'available');
            })
            ->withCount(['units' => function ($q) {
                $q->where('status', 'available');
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($tool) {
                return [
                    'id' => $tool->id,
                    'code' => 'TL-' . str_pad($tool->id, 6, '0', STR_PAD_LEFT),
                    'name' => $tool->name,
                    'description' => $tool->description,
                    'quantity' => $tool->units_count,
                ];
            });
    }

    public function getAvailableSupplies()
    {
        $viveroId = app(\App\Modules\Shared\Support\CurrentVivero::class)->id();
        
        $query = Supply::query();
        if ($viveroId) {
            $query->where('vivero_id', $viveroId);
        }

        return $query->where('current_stock', '>', 0)
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
