<?php

namespace App\Modules\Logistics\Models;

use App\Modules\Shared\Models\User;
use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PurchaseOrder extends Model
{
    use HasFactory, BelongsToVivero;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ISSUED = 'issued';

    public const STATUS_SENT = 'sent';

    public const STATUS_RECEIVED = 'received';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'vivero_id', 'order_number', 'supplier_id', 'created_by', 'status',
        'issued_at', 'estimated_delivery_date', 'total', 'reconciles_existing_inventory',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'estimated_delivery_date' => 'date:Y-m-d',
        'total' => 'decimal:2',
        'reconciles_existing_inventory' => 'boolean',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(PurchaseReceipt::class);
    }
}
