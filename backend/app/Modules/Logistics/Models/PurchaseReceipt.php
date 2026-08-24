<?php

namespace App\Modules\Logistics\Models;

use App\Modules\Shared\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReceipt extends Model
{
    use HasFactory;

    public const QUALITY_APPROVED = 'approved';

    public const QUALITY_REJECTED = 'rejected';

    public const QUALITY_CONDITIONAL = 'conditional';

    protected $fillable = [
        'purchase_order_id', 'received_by', 'received_at',
        'quality_status', 'observations', 'photo_evidence_url',
    ];

    protected $casts = [
        'received_at' => 'datetime',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
