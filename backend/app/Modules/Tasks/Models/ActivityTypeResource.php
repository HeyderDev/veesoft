<?php

namespace App\Modules\Tasks\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityTypeResource extends Model
{
    protected $fillable = [
        'activity_type_id',
        'resource_type',
        'resource_id',
        'quantity',
    ];

    public function activityType(): BelongsTo
    {
        return $this->belongsTo(ActivityType::class);
    }
}
