<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Tracking\Models\TrackingMovement; // Use TrackingMovement? No, inventory Movement. Let's use correct namespace
use App\Modules\Inventory\Models\Movement;

class ToolUnit extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tool_id',
        'code',
        'status',
    ];

    public function tool(): BelongsTo
    {
        return $this->belongsTo(Tool::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(Movement::class);
    }
}
