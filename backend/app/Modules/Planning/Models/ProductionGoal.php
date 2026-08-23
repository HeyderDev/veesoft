<?php

namespace App\Modules\Planning\Models;

use App\Modules\Shared\Models\User;
use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionGoal extends Model
{
    use HasFactory, BelongsToVivero;

    public const STATUS_NOT_STARTED = 'not_started';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'vivero_id', 'title', 'description', 'target_seedlings',
        'status', 'finished_at', 'created_by',
    ];

    protected $casts = [
        'finished_at' => 'datetime',
    ];

    public function vivero(): BelongsTo
    {
        return $this->belongsTo(Vivero::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function dispatches(): HasMany
    {
        return $this->hasMany(Dispatch::class, 'production_goal_id');
    }

    public function isCulminated(): bool
    {
        return $this->finished_at !== null;
    }

    /**
     * Normaliza el resultado de withSum('dispatches as produced_seedlings', 'quantity'):
     * MySQL devuelve NULL, no 0, cuando la meta todavía no tiene despachos.
     */
    protected function producedSeedlings(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => (int) ($value ?? 0),
        );
    }
}
