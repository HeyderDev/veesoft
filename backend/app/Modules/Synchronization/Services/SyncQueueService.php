<?php

namespace App\Modules\Synchronization\Services;

use App\Modules\Synchronization\Enums\SyncDirection;
use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Enums\SyncStatus;
use App\Modules\Synchronization\Events\SyncableDomainEvent;
use App\Modules\Synchronization\Models\SyncQueue;
use App\Modules\Synchronization\Repositories\Contracts\SyncEntityStateRepositoryInterface;
use App\Modules\Synchronization\Repositories\Contracts\SyncNodeRepositoryInterface;
use App\Modules\Synchronization\Repositories\Contracts\SyncQueueRepositoryInterface;
use DomainException;
use Illuminate\Support\Facades\DB;

class SyncQueueService
{
    public function __construct(
        private readonly SyncQueueRepositoryInterface $queue,
        private readonly SyncEntityStateRepositoryInterface $states,
        private readonly SyncNodeRepositoryInterface $nodes,
        private readonly SyncNodeService $nodeService,
    ) {}

    public function enqueue(SyncableDomainEvent $event): SyncQueue
    {
        $localNodeId = (string) config('synchronization.local_node.id');
        $targetNodeId = (string) config('synchronization.default_target.id');
        $this->nodeService->ensureConfiguredNodes();

        if ($event->originNodeId() !== $localNodeId) {
            throw new DomainException(
                'El nodo de origen del evento no coincide con la identidad local configurada.'
            );
        }

        if (! $this->nodes->findActive($localNodeId)) {
            throw new DomainException('El nodo local no está registrado o se encuentra inactivo.');
        }

        if (! $this->nodes->findActive($targetNodeId)) {
            throw new DomainException('El nodo destino no está registrado o se encuentra inactivo.');
        }

        $existing = $this->queue->findDelivery($event->eventId(), $targetNodeId);
        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($event, $targetNodeId) {
            $state = $this->states->findForUpdate(
                $event->entityType(),
                $event->entityId(),
            );

            if ($state) {
                $version = $state->version + 1;
                $baseVersion = $state->synced_version;
                $this->states->updateState($state, [
                    'version' => $version,
                    'tombstoned_at' => $event->operation() === SyncOperation::DELETED
                        ? $event->occurredAt()
                        : null,
                ]);
            } else {
                $version = 1;
                $baseVersion = 0;
                $this->states->create([
                    'entity_type' => $event->entityType(),
                    'entity_id' => $event->entityId(),
                    'origin_node_id' => $event->originNodeId(),
                    'version' => $version,
                    'synced_version' => 0,
                    'tombstoned_at' => $event->operation() === SyncOperation::DELETED
                        ? $event->occurredAt()
                        : null,
                ]);
            }

            return $this->queue->create([
                'event_id' => $event->eventId(),
                'direction' => SyncDirection::OUTBOUND,
                'entity_type' => $event->entityType(),
                'entity_id' => $event->entityId(),
                'operation' => $event->operation(),
                'origin_node_id' => $event->originNodeId(),
                'target_node_id' => $targetNodeId,
                'base_version' => $baseVersion,
                'entity_version' => $version,
                'status' => SyncStatus::PENDING,
                'occurred_at' => $event->occurredAt(),
                'available_at' => now(),
            ]);
        });
    }
}
