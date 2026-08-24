<?php

namespace App\Modules\Logistics\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_request_id', 'supply_id', 'tool_id', 'item_sku', 'item_name', 'unit', 'quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function supply(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Inventory\Models\Supply::class);
    }

    public function tool(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Inventory\Models\Tool::class);
    }
}
