<?php

namespace App\Modules\Synchronization\Models;

use App\Modules\Shared\Models\User;
use App\Modules\Synchronization\Enums\SyncConflictStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncConflict extends Model
{
    use HasUuids;

    protected $fillable = [
        'sync_queue_id',
        'event_id',
        'entity_type',
        'entity_id',
        'local_version',
        'incoming_base_version',
        'incoming_entity_version',
        'local_payload',
        'incoming_payload',
        'reason',
        'status',
        'resolution',
        'resolved_by',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'local_version' => 'integer',
            'incoming_base_version' => 'integer',
            'incoming_entity_version' => 'integer',
            'local_payload' => 'array',
            'incoming_payload' => 'array',
            'status' => SyncConflictStatus::class,
            'resolved_at' => 'immutable_datetime',
        ];
    }

    public function queueEntry(): BelongsTo
    {
        return $this->belongsTo(SyncQueue::class, 'sync_queue_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
