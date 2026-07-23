<?php

namespace App\Modules\Planning\Models;

use App\Modules\Shared\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LotCycleReschedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'lot_cycle_id', 'from_phase_id', 'to_phase_id',
        'previous_transition_date', 'new_transition_date', 'rescheduled_by',
    ];

    protected $casts = [
        'previous_transition_date' => 'date:Y-m-d',
        'new_transition_date' => 'date:Y-m-d',
    ];

    public function lotCycle(): BelongsTo
    {
        return $this->belongsTo(LotCycle::class);
    }

    public function fromPhase(): BelongsTo
    {
        return $this->belongsTo(ProductionPhase::class, 'from_phase_id');
    }

    public function toPhase(): BelongsTo
    {
        return $this->belongsTo(ProductionPhase::class, 'to_phase_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rescheduled_by');
    }
}
