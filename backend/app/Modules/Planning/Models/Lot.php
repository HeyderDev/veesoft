<?php

namespace App\Modules\Planning\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lot extends Model
{
    use HasFactory;

    public const STATUS_AVAILABLE = 'available';

    public const STATUS_OCCUPIED = 'occupied';

    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'vivero_id', 'code', 'name',
        'funda_diameter', 'width', 'length', 'corridor_count', 'corridor_width',
        'calculated_capacity', 'total_capacity',
        'current_status', 'position_x', 'position_y', 'notes',
    ];

    protected $casts = [
        'funda_diameter' => 'decimal:2',
        'width' => 'decimal:2',
        'length' => 'decimal:2',
        'corridor_width' => 'decimal:2',
        'position_x' => 'decimal:2',
        'position_y' => 'decimal:2',
    ];

    public function vivero(): BelongsTo
    {
        return $this->belongsTo(Vivero::class);
    }

    public function lotCycles(): HasMany
    {
        return $this->hasMany(LotCycle::class);
    }

    public function activeCycle(): HasOne
    {
        return $this->hasOne(LotCycle::class)->where('status', LotCycle::STATUS_IN_PROGRESS);
    }

    public function climateEventLots(): HasMany
    {
        return $this->hasMany(ClimateEventLot::class);
    }
}
