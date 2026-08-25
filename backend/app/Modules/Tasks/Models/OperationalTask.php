<?php

namespace App\Modules\Tasks\Models;

use App\Modules\Planning\Models\LotCyclePhase;
use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Shared\Models\User;
use App\Modules\Shared\Traits\BelongsToVivero;
use Database\Factories\OperationalTaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperationalTask extends Model
{
    /** @use HasFactory<OperationalTaskFactory> */
    use HasFactory, BelongsToVivero;

    protected $appends = [
        'lot_id',
    ];

    protected $fillable = [
        'vivero_id',
        'production_goal_id',
        'lot_cycle_phase_id',
        'activity_type_id',
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

    public function getLotIdAttribute(): ?int
    {
        return $this->lotCyclePhase?->lotCycle?->lot_id;
    }

    // Nombrada `assignee` (no `assignedTo`) a propósito: Eloquent serializa el
    // nombre de la relación en snake_case (`assignedTo` -> `assigned_to`), lo
    // que pisaría la columna cruda `assigned_to` (el ID) en el JSON de salida
    // con el objeto User completo — el frontend espera un número ahí.
    public function assignee(): BelongsTo
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

    public function productionGoal(): BelongsTo
    {
        return $this->belongsTo(ProductionGoal::class);
    }

    public function activityType(): BelongsTo
    {
        return $this->belongsTo(ActivityType::class, 'activity_type_id');
    }

    public function resources(): HasMany
    {
        return $this->hasMany(TaskResource::class, 'operational_task_id');
    }
}
