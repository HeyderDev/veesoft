<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tool extends Model
{
    use HasFactory, SoftDeletes, BelongsToVivero;

    public const STATUS_AVAILABLE = 'AVAILABLE';

    public const STATUS_BORROWED = 'BORROWED';

    public const STATUS_MAINTENANCE = 'MAINTENANCE';

    public const STATUS_DAMAGED = 'DAMAGED';

    protected $fillable = [
        'vivero_id', 'code', 'name', 'description', 'status', 'quantity',
    ];

    public function movements(): HasMany
    {
        return $this->hasMany(Movement::class);
    }
}
