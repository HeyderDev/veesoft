<?php

namespace App\Modules\Planning\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vivero extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'location', 'responsible'];

    public function metas(): HasMany
    {
        return $this->hasMany(ProductionGoal::class);
    }

    public function lots(): HasMany
    {
        return $this->hasMany(Lot::class);
    }

    public function productionPhases(): HasMany
    {
        return $this->hasMany(ProductionPhase::class);
    }
}
