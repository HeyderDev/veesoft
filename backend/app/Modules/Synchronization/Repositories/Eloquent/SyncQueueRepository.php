<?php

namespace App\Modules\Synchronization\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Synchronization\Enums\SyncDirection;
use App\Modules\Synchronization\Enums\SyncStatus;
use App\Modules\Synchronization\Models\SyncQueue;
use App\Modules\Synchronization\Repositories\Contracts\SyncQueueRepositoryInterface;
use Illuminate\Support\Collection;

class SyncQueueRepository extends BaseRepository implements SyncQueueRepositoryInterface
{
    public function __construct(SyncQueue $model)
    {
        parent::__construct($model);
    }

    public function create(array $data): SyncQueue
    {
        /** @var SyncQueue */
        return parent::create($data);
    }

    public function find($id): SyncQueue
    {
        /** @var SyncQueue */
        return parent::find($id);
    }

    public function findForUpdate(string $id): ?SyncQueue
    {
        return $this->model
            ->newQuery()
            ->whereKey($id)
            ->lockForUpdate()
            ->first();
    }

    public function findDelivery(string $eventId, string $targetNodeId): ?SyncQueue
    {
        return $this->model
            ->newQuery()
            ->where('event_id', $eventId)
            ->where('target_node_id', $targetNodeId)
            ->first();
    }

    public function duePending(int $limit): Collection
    {
        return $this->model
            ->newQuery()
            ->where('direction', SyncDirection::OUTBOUND->value)
            ->where('status', SyncStatus::PENDING->value)
            ->where(function ($query) {
                $query
                    ->whereNull('available_at')
                    ->orWhere('available_at', '<=', now());
            })
            ->orderByDesc('priority')
            ->orderBy('occurred_at')
            ->limit($limit)
            ->get();
    }

    public function updateEntry(SyncQueue $entry, array $data): SyncQueue
    {
        $entry->update($data);

        return $entry->refresh();
    }
}
