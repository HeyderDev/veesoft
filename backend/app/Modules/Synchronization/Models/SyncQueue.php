<?php

namespace App\Modules\Synchronization\Models;

use App\Modules\Synchronization\Enums\SyncDirection;
use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Enums\SyncStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SyncQueue extends Model
{
    use HasUuids;

    protected $table = 'sync_queue';

    protected $fillable = [
        'event_id',
        'direction',
        'entity_type',
        'entity_id',
        'operation',
        'origin_node_id',
        'target_node_id',
        'base_version',
        'entity_version',
        'remote_version',
        'status',
        'priority',
        'attempts',
        'occurred_at',
        'available_at',
        'locked_at',
        'lock_token',
        'payload',
        'payload_hash',
        'last_http_status',
        'last_error',
        'synced_at',
        'conflicted_at',
    ];

    protected function casts(): array
    {
        return [
            'direction' => SyncDirection::class,
            'operation' => SyncOperation::class,
            'status' => SyncStatus::class,
            'base_version' => 'integer',
            'entity_version' => 'integer',
            'remote_version' => 'integer',
            'priority' => 'integer',
            'attempts' => 'integer',
            'occurred_at' => 'immutable_datetime',
            'available_at' => 'immutable_datetime',
            'locked_at' => 'immutable_datetime',
            'payload' => 'array',
            'last_http_status' => 'integer',
            'synced_at' => 'immutable_datetime',
            'conflicted_at' => 'immutable_datetime',
        ];
    }

    public function originNode(): BelongsTo
    {
        return $this->belongsTo(SyncNode::class, 'origin_node_id');
    }

    public function targetNode(): BelongsTo
    {
        return $this->belongsTo(SyncNode::class, 'target_node_id');
    }

    public function conflicts(): HasMany
    {
        return $this->hasMany(SyncConflict::class);
    }
}
