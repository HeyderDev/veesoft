<?php

namespace App\Modules\Planning\Models;

use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionPhase extends Model
{
    use HasFactory, BelongsToVivero;

    protected $fillable = [
        'vivero_id', 'code', 'name', 'description',
        'execution_order', 'estimated_duration_days', 'color_reference',
    ];

    public function vivero(): BelongsTo
    {
        return $this->belongsTo(Vivero::class);
    }

    public function lotCyclePhases(): HasMany
    {
        return $this->hasMany(LotCyclePhase::class, 'phase_id');
    }
}
