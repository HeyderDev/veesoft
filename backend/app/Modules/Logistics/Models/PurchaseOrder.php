<?php

namespace App\Modules\Logistics\Models;

use App\Modules\Shared\Models\User;
<<<<<<< HEAD
=======
use App\Modules\Shared\Traits\BelongsToVivero;
>>>>>>> 727f1891df3d6119d5da307f211624a5f3ab9519
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PurchaseOrder extends Model
{
<<<<<<< HEAD
    use HasFactory;
=======
    use HasFactory, BelongsToVivero;
>>>>>>> 727f1891df3d6119d5da307f211624a5f3ab9519

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ISSUED = 'issued';

    public const STATUS_SENT = 'sent';

    public const STATUS_RECEIVED = 'received';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
<<<<<<< HEAD
        'order_number', 'supplier_id', 'created_by', 'status',
=======
        'vivero_id', 'order_number', 'supplier_id', 'created_by', 'status',
>>>>>>> 727f1891df3d6119d5da307f211624a5f3ab9519
        'issued_at', 'estimated_delivery_date', 'total',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'estimated_delivery_date' => 'date',
        'total' => 'decimal:2',
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
