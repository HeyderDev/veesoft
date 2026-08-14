<?php

namespace App\Modules\Synchronization\Services;

use App\Modules\Synchronization\Enums\SyncDirection;
use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Enums\SyncStatus;
use App\Modules\Synchronization\Models\SyncQueue;
use App\Modules\Synchronization\Repositories\Contracts\SyncEntityStateRepositoryInterface;
use App\Modules\Synchronization\Repositories\Contracts\SyncQueueRepositoryInterface;
use DomainException;
use Illuminate\Support\Facades\DB;

class ReceiveSynchronizationService
{
    public function __construct(
        private readonly SyncNodeService $nodes,
        private readonly SyncQueueRepositoryInterface $queue,
        private readonly SyncEntityStateRepositoryInterface $states,
        private readonly SyncEntityRegistry $entities,
        private readonly SyncPayloadHasher $hasher,
        private readonly SynchronizationContext $context,
        private readonly SyncConflictService $conflicts,
    ) {}

    public function receive(array $data, ?string $token): array
    {
        $this->nodes->authenticate($data['origin_node_id'], $token);

        $localNodeId = (string) config('synchronization.local_node.id');
        $existing = $this->queue->findDelivery($data['event_id'], $localNodeId);

        if ($existing) {
            return [
                'status' => $existing->status->value,
                'message' => $existing->status === SyncStatus::CONFLICT
                    ? 'El evento ya había sido registrado como conflicto.'
                    : 'Evento procesado previamente.',
                'data' => [
                    'duplicate' => true,
                    'version' => $existing->remote_version ?? $existing->entity_version,
                    'current_version' => $existing->remote_version,
                ],
            ];
        }

        if (! hash_equals($data['payload_hash'], $this->hasher->hash($data['payload'] ?? null))) {
            return [
                'status' => 'invalid',
                'message' => 'El hash del payload no coincide con su contenido.',
                'data' => null,
            ];
        }

        $adapter = $this->entities->resolve($data['entity_type']);

        try {
            return DB::transaction(function () use ($data, $localNodeId, $adapter) {
                $state = $this->states->findForUpdate(
                    $data['entity_type'],
                    (string) $data['entity_id'],
                );
                $currentVersion = $state?->version ?? 0;

                if ((int) $data['base_version'] !== $currentVersion) {
                    return $this->recordConflict(
                        $data,
                        $localNodeId,
                        $currentVersion,
                        'version_mismatch',
                        $adapter->export((string) $data['entity_id']),
                    );
                }

                $operation = SyncOperation::from($data['operation']);
                $this->context->whileReceiving(
                    fn () => $adapter->apply(
                        (string) $data['entity_id'],
                        $operation,
                        $data['payload'] ?? null,
                    )
                );

                if ($state) {
                    $this->states->updateState($state, [
                        'version' => (int) $data['entity_version'],
                        'synced_version' => (int) $data['entity_version'],
                        'content_hash' => $data['payload_hash'],
                        'tombstoned_at' => $operation === SyncOperation::DELETED
                            ? now()
                            : null,
                    ]);
                } else {
                    $this->states->create([
                        'entity_type' => $data['entity_type'],
                        'entity_id' => (string) $data['entity_id'],
                        'origin_node_id' => $data['origin_node_id'],
                        'version' => (int) $data['entity_version'],
                        'synced_version' => (int) $data['entity_version'],
                        'content_hash' => $data['payload_hash'],
                        'tombstoned_at' => $operation === SyncOperation::DELETED
                            ? now()
                            : null,
                    ]);
                }

                $entry = $this->createInboundQueue(
                    $data,
                    $localNodeId,
                    SyncStatus::SYNCED,
                    (int) $data['entity_version'],
                );

                return [
                    'status' => SyncStatus::SYNCED->value,
                    'message' => 'Cambio sincronizado correctamente.',
                    'data' => [
                        'duplicate' => false,
                        'queue_id' => $entry->id,
                        'version' => (int) $data['entity_version'],
                    ],
                ];
            });
        } catch (DomainException $exception) {
            return DB::transaction(function () use ($data, $localNodeId, $adapter, $exception) {
                $state = $this->states->findForUpdate(
                    $data['entity_type'],
                    (string) $data['entity_id'],
                );

                return $this->recordConflict(
                    $data,
                    $localNodeId,
                    $state?->version ?? 0,
                    'business_rule',
                    $adapter->export((string) $data['entity_id']),
                    $exception->getMessage(),
                );
            });
        }
    }

    private function recordConflict(
        array $data,
        string $localNodeId,
        int $currentVersion,
        string $reason,
        ?array $currentPayload,
        ?string $detail = null,
    ): array {
        $entry = $this->createInboundQueue(
            $data,
            $localNodeId,
            SyncStatus::CONFLICT,
            $currentVersion,
        );
        $conflict = $this->conflicts->record(
            $entry,
            $currentVersion,
            $reason,
            $currentPayload,
            $data['payload'] ?? null,
        );

        return [
            'status' => SyncStatus::CONFLICT->value,
            'message' => $detail ?? 'La versión de origen no coincide con la versión central.',
            'data' => [
                'conflict_id' => $conflict->id,
                'reason' => $reason,
                'current_version' => $currentVersion,
                'current_payload' => $currentPayload,
            ],
        ];
    }

    private function createInboundQueue(
        array $data,
        string $localNodeId,
        SyncStatus $status,
        int $remoteVersion,
    ): SyncQueue {
        return $this->queue->create([
            'event_id' => $data['event_id'],
            'direction' => SyncDirection::INBOUND,
            'entity_type' => $data['entity_type'],
            'entity_id' => (string) $data['entity_id'],
            'operation' => SyncOperation::from($data['operation']),
            'origin_node_id' => $data['origin_node_id'],
            'target_node_id' => $localNodeId,
            'base_version' => (int) $data['base_version'],
            'entity_version' => (int) $data['entity_version'],
            'remote_version' => $remoteVersion,
            'status' => $status,
            'occurred_at' => $data['occurred_at'],
            'payload' => $data['payload'] ?? null,
            'payload_hash' => $data['payload_hash'],
            'synced_at' => $status === SyncStatus::SYNCED ? now() : null,
            'conflicted_at' => $status === SyncStatus::CONFLICT ? now() : null,
        ]);
    }
}
