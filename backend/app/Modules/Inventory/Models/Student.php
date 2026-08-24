<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Shared\Traits\BelongsToVivero;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes, BelongsToVivero;

    protected $fillable = [
        'vivero_id',
        'cedula',
        'first_name',
        'last_name',
        'career',
        'semester',
    ];

    public function movements()
    {
        return $this->hasMany(Movement::class);
    }
}
