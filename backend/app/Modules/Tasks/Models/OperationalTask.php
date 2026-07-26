<?php

namespace App\Modules\Tasks\Models;

use App\Modules\Planning\Models\LotCyclePhase;
use App\Modules\Shared\Models\User;
use Database\Factories\OperationalTaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperationalTask extends Model
{
    /** @use HasFactory<OperationalTaskFactory> */
    use HasFactory;

    protected $fillable = [
        'lot_cycle_phase_id',
        'title',
        'description',
        'observations',
        'assigned_to',
        'status',
        'priority',
        'planned_date',
        'completed_date',
        'completed_by',
    ];

    protected $casts = [
        'planned_date' => 'date:Y-m-d',
        'completed_date' => 'datetime',
    ];

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function lotCyclePhase(): BelongsTo
    {
        return $this->belongsTo(LotCyclePhase::class, 'lot_cycle_phase_id');
    }

    public function resources(): HasMany
    {
        return $this->hasMany(TaskResource::class, 'operational_task_id');
    }
}
