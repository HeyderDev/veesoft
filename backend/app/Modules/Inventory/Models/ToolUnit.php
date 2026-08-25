<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Inventory\Models\Movement;

class ToolUnit extends Model
{
    use HasFactory, SoftDeletes, BelongsToVivero;

    protected $fillable = [
        'vivero_id',
        'tool_id',
        'purchase_order_item_id',
        'code',
        'status',
    ];

    public function tool(): BelongsTo
    {
        return $this->belongsTo(Tool::class);
    }

    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Logistics\Models\PurchaseOrderItem::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(Movement::class);
    }
}
