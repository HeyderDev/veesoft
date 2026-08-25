<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Logistics\Models\PurchaseOrderItem;
use App\Modules\Logistics\Models\Supplier;
use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tool extends Model
{
    use BelongsToVivero, HasFactory, SoftDeletes;

    protected $fillable = [
        'vivero_id', 'name', 'description',
    ];

    public function units(): HasMany
    {
        return $this->hasMany(ToolUnit::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(Movement::class);
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class)
            ->withPivot('unit_price')
            ->withTimestamps();
    }
}
