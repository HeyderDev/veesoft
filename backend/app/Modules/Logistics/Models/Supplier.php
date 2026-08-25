<?php

namespace App\Modules\Logistics\Models;

use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes, BelongsToVivero;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'vivero_id', 'name', 'tax_id', 'email', 'phone', 'address',
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

    public function certification(): HasOne
    {
        return $this->hasOne(SupplierCertification::class);
    }

    public function supplies(): BelongsToMany
    {
        return $this->belongsToMany(\App\Modules\Inventory\Models\Supply::class)
            ->withPivot('unit_price')
            ->withTimestamps();
    }

    public function tools(): BelongsToMany
    {
        return $this->belongsToMany(\App\Modules\Inventory\Models\Tool::class)
            ->withPivot('unit_price')
            ->withTimestamps();
    }
}
