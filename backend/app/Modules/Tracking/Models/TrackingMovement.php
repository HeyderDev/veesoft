<?php

namespace App\Modules\Tracking\Models;

use App\Modules\Planning\Models\Lot;
use Database\Factories\TrackingMovementFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrackingMovement extends Model
{
    /** @use HasFactory<TrackingMovementFactory> */
    use HasFactory;

    protected $fillable = [
        'lot_id', 'tracking_client_id', 'quantity', 'movement_date', 'notes',
    ];

    protected $casts = [
        'movement_date' => 'datetime',
    ];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    /**
     * `withTrashed()` porque un movimiento historico debe seguir mostrando el
     * nombre del cliente aunque este se haya eliminado (soft delete) despues.
     */
    public function trackingClient(): BelongsTo
    {
        return $this->belongsTo(TrackingClient::class)->withTrashed();
    }
}
