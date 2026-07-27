<?php

namespace App\Modules\Tracking\Models;

use Database\Factories\TrackingItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrackingItem extends Model
{
    /** @use HasFactory<TrackingItemFactory> */
    use HasFactory, SoftDeletes;

    public const STAGE_GERMINATION = 'germination';

    public const STAGE_NURSERY = 'nursery';

    public const STAGE_TRANSPLANT = 'transplant';

    public const STAGE_READY_FOR_DISPATCH = 'ready_for_dispatch';

    protected $fillable = [
        'name', 'species', 'stage', 'quantity', 'unit',
        'location', 'minimum_stock', 'notes', 'registered_at',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
    ];

    public function movements(): HasMany
    {
        return $this->hasMany(TrackingMovement::class)->orderByDesc('movement_date');
    }
}
