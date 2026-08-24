<?php

namespace App\Modules\Tasks\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskResource extends Model
{
    protected $table = 'operational_task_resources';

    protected $fillable = [
        'operational_task_id',
        'resource_type',
        'resource_id',
        'quantity',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(OperationalTask::class, 'operational_task_id');
    }
}
