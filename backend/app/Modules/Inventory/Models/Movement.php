<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Shared\Models\User;
use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Movement extends Model
{
    use HasFactory, SoftDeletes, BelongsToVivero;

    public const TYPE_ADJUSTMENT = 'ADJUSTMENT';

    public const TYPE_MAINTENANCE = 'MAINTENANCE';

    public const TYPE_RETURN = 'RETURN';

    public const TYPE_BORROWED = 'BORROWED';

    protected $fillable = [
        'vivero_id',
        'tool_id',
        'tool_unit_id',
        'supply_id',
        'user_id',
        'operational_task_id',
        'type',
        'quantity',
        'previous_stock',
        'new_stock',
        'reason',
        'scanned_code',
        'batch',
        'details',
        'observations',
        'sync_id',
        'origin_node',
        'origin_module',
        'sync_status',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'previous_stock' => 'decimal:2',
        'new_stock' => 'decimal:2',
        'details' => 'array',
    ];

    public function tool(): BelongsTo
    {
        return $this->belongsTo(Tool::class);
    }

    public function supply(): BelongsTo
    {
        return $this->belongsTo(Supply::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toolUnit(): BelongsTo
    {
        return $this->belongsTo(ToolUnit::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function operationalTask(): BelongsTo
    {
        // Operational tasks seem to not be in a module? Wait, they are in DB, but I'll need to check the exact namespace. 
        // Assuming App\Models\OperationalTask for now, or App\Modules\Tasks\Models\OperationalTask
        // I will use \App\Modules\Tasks\Models\OperationalTask if it exists.
        // Let's search it next. For now:
        return $this->belongsTo(\App\Modules\Tasks\Models\OperationalTask::class);
    }
}
