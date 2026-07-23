<?php

namespace App\Modules\Planning\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LotCycle extends Model
{
    use HasFactory;

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_DISPATCHED = 'dispatched';

    protected $fillable = ['lot_id', 'production_goal_id', 'started_at', 'status'];

    protected $casts = [
        'started_at' => 'date:Y-m-d',
    ];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(ProductionGoal::class, 'production_goal_id');
    }

    public function phases(): HasMany
    {
        return $this->hasMany(LotCyclePhase::class);
    }

    public function dispatch(): HasOne
    {
        return $this->hasOne(Dispatch::class);
    }

    public function reschedules(): HasMany
    {
        return $this->hasMany(LotCycleReschedule::class);
    }
}
