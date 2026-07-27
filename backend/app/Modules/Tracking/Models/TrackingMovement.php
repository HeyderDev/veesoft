<?php

namespace App\Modules\Tracking\Models;

use Database\Factories\TrackingMovementFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrackingMovement extends Model
{
    /** @use HasFactory<TrackingMovementFactory> */
    use HasFactory;

    public const TYPE_ENTRY = 'entry';

    public const TYPE_EXIT = 'exit';

    protected $fillable = [
        'tracking_item_id', 'type', 'quantity', 'movement_date', 'notes',
    ];

    protected $casts = [
        'movement_date' => 'datetime',
    ];

    public function trackingItem(): BelongsTo
    {
        return $this->belongsTo(TrackingItem::class);
    }
}
