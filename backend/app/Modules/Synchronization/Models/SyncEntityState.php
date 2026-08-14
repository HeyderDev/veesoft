<?php

namespace App\Modules\Synchronization\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncEntityState extends Model
{
    use HasUuids;

    protected $fillable = [
        'entity_type',
        'entity_id',
        'origin_node_id',
        'version',
        'synced_version',
        'content_hash',
        'tombstoned_at',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'synced_version' => 'integer',
            'tombstoned_at' => 'immutable_datetime',
        ];
    }

    public function originNode(): BelongsTo
    {
        return $this->belongsTo(SyncNode::class, 'origin_node_id');
    }
}
