<?php

namespace App\Modules\Planning\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LotCyclePhase extends Model
{
    use HasFactory;

    protected $fillable = ['lot_cycle_id', 'phase_id', 'planned_start_date', 'planned_end_date', 'gate_completed_at'];

    protected $casts = [
        'planned_start_date' => 'date:Y-m-d',
        'planned_end_date' => 'date:Y-m-d',
        'gate_completed_at' => 'datetime',
    ];

    public function lotCycle(): BelongsTo
    {
        return $this->belongsTo(LotCycle::class);
    }

    public function phase(): BelongsTo
    {
        return $this->belongsTo(ProductionPhase::class, 'phase_id');
    }
}
