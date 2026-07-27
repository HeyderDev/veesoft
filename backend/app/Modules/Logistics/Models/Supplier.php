<?php

namespace App\Modules\Logistics\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'name', 'tax_id', 'email', 'phone', 'address',
        'organic_certified', 'certificate_expires_at', 'score', 'status',
    ];

    protected $casts = [
        'organic_certified' => 'boolean',
        'certificate_expires_at' => 'date',
        'score' => 'decimal:2',
    ];

    public function evaluations(): HasMany
    {
        return $this->hasMany(SupplierEvaluation::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
