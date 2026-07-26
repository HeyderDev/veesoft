<?php

namespace App\Modules\Shared\Models;

use App\Modules\Planning\Models\ProductionCycle;
use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Models\ProductionPlan;
use App\Modules\Planning\Models\Reschedule;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'role_id',
        'first_name',
        'last_name',
        'email',
        'password',
        'phone',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relationships
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function productionGoals(): HasMany
    {
        return $this->hasMany(ProductionGoal::class, 'created_by');
    }

    public function productionPlans(): HasMany
    {
        return $this->hasMany(ProductionPlan::class, 'created_by');
    }

    public function productionCycles(): HasMany
    {
        return $this->hasMany(ProductionCycle::class, 'created_by');
    }

    public function approvedReschedules(): HasMany
    {
        return $this->hasMany(Reschedule::class, 'approved_by');
    }
}
