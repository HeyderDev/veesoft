<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tool extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'description',
    ];

    public function units(): HasMany
    {
        return $this->hasMany(ToolUnit::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(Movement::class);
    }
}
