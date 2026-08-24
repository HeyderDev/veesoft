<?php

namespace App\Modules\Tracking\Models;

use App\Modules\Shared\Traits\BelongsToVivero;
use Database\Factories\TrackingClientFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrackingClient extends Model
{
    /** @use HasFactory<TrackingClientFactory> */
    use HasFactory, SoftDeletes, BelongsToVivero;

    protected $fillable = [
        'vivero_id', 'name', 'cedula', 'phone',
    ];

    public function movements(): HasMany
    {
        return $this->hasMany(TrackingMovement::class);
    }
}
