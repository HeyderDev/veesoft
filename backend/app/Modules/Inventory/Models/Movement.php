<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Shared\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Movement extends Model
{
    use HasFactory, SoftDeletes;

    public const TYPE_ADJUSTMENT = 'ADJUSTMENT';
    public const TYPE_MAINTENANCE = 'MAINTENANCE';
    public const TYPE_RETURN = 'RETURN';
    public const TYPE_BORROWED = 'BORROWED';

    protected $fillable = [
        'tool_id', 'supply_id', 'user_id', 'type', 'quantity', 'details'
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
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
}
