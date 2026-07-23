<?php

namespace App\Modules\Planning\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispatch extends Model
{
    use HasFactory;

    protected $fillable = ['lot_id', 'lot_cycle_id', 'production_goal_id', 'quantity', 'dispatched_at'];

    protected $casts = [
        'dispatched_at' => 'date:Y-m-d',
    ];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function lotCycle(): BelongsTo
    {
        return $this->belongsTo(LotCycle::class);
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(ProductionGoal::class, 'production_goal_id');
    }
}
