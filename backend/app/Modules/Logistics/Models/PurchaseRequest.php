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

class PurchaseRequest extends Model
{
<<<<<<< HEAD
    use HasFactory;
=======
    use HasFactory, BelongsToVivero;
>>>>>>> 727f1891df3d6119d5da307f211624a5f3ab9519

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
<<<<<<< HEAD
        'requested_by', 'reason', 'status', 'reviewed_by', 'reviewed_at', 'purchase_order_id',
=======
        'vivero_id', 'requested_by', 'reason', 'status', 'reviewed_by', 'reviewed_at', 'purchase_order_id',
>>>>>>> 727f1891df3d6119d5da307f211624a5f3ab9519
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }
}
