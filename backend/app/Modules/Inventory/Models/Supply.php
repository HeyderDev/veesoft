<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supply extends Model
{
    use HasFactory, SoftDeletes, BelongsToVivero;

    protected $fillable = [
        'vivero_id',
        'sku',
        'name',
        'description',
        'category',
        'unit',
        'total_stock',
        'current_stock',
        'max_stock',
        'min_stock',
        'batch',
        'entry_date',
        'expiration_date',
        'supplier',
        'location',
        'status',
        'sync_id',
        'origin_node',
        'origin_module',
        'sync_status',
    ];

    protected $casts = [
        'current_stock' => 'decimal:2',
        'total_stock' => 'decimal:2',
        'min_stock' => 'decimal:2',
        'max_stock' => 'decimal:2',
        'entry_date' => 'date',
        'expiration_date' => 'date',
    ];

    public function movements(): HasMany
    {
        return $this->hasMany(Movement::class);
    }
}
