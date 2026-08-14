<?php

namespace App\Modules\Synchronization\Models;

use App\Modules\Synchronization\Enums\SyncNodeType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SyncNode extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'code',
        'name',
        'node_type',
        'base_url',
        'token_hash',
        'token_prefix',
        'is_active',
        'last_seen_at',
        'metadata',
    ];

    protected $hidden = [
        'token_hash',
    ];

    protected function casts(): array
    {
        return [
            'node_type' => SyncNodeType::class,
            'is_active' => 'boolean',
            'last_seen_at' => 'immutable_datetime',
            'metadata' => 'array',
        ];
    }

    public function outboundQueue(): HasMany
    {
        return $this->hasMany(SyncQueue::class, 'origin_node_id');
    }

    public function inboundQueue(): HasMany
    {
        return $this->hasMany(SyncQueue::class, 'target_node_id');
    }
}
