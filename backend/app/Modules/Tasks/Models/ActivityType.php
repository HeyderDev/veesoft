<?php

namespace App\Modules\Tasks\Models;

use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ActivityType extends Model
{
    use BelongsToVivero;

    protected $fillable = [
        'vivero_id',
        'name',
        'description',
        'is_system',
        'system_code',
        'default_priority',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    public function tasks(): HasMany
    {
        return $this->hasMany(OperationalTask::class, 'activity_type_id');
    }
}
