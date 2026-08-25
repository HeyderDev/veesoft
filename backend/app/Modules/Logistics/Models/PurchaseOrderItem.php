<?php

namespace App\Modules\Logistics\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id', 'supply_id', 'tool_id', 'item_sku', 'item_name', 'unit', 'quantity', 'unit_price',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function supply(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Inventory\Models\Supply::class);
    }

    public function tool(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Inventory\Models\Tool::class);
    }

    public function toolUnits(): HasMany
    {
        return $this->hasMany(\App\Modules\Inventory\Models\ToolUnit::class);
    }

    public function supplyMovements(): HasMany
    {
        return $this->hasMany(\App\Modules\Inventory\Models\Movement::class);
    }
}
