<?php

namespace App\Modules\Synchronization\Services;

use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Enums\SyncStatus;
use App\Modules\Synchronization\Models\SyncQueue;
use App\Modules\Synchronization\Repositories\Contracts\SyncEntityStateRepositoryInterface;
use App\Modules\Synchronization\Repositories\Contracts\SyncNodeRepositoryInterface;
use App\Modules\Synchronization\Repositories\Contracts\SyncQueueRepositoryInterface;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class PushSynchronizationService
{
    public function __construct(
        private readonly SyncQueueRepositoryInterface $queue,
        private readonly SyncEntityStateRepositoryInterface $states,
        private readonly SyncNodeRepositoryInterface $nodes,
        private readonly SyncEntityRegistry $entities,
        private readonly SyncPayloadHasher $hasher,
        private readonly SyncTransportService $transport,
        private readonly SyncConflictService $conflicts,
    ) {}

    public function process(string $queueId): void
    {
        $entry = $this->claim($queueId);

        if (! $entry) {
            return;
        }

        try {
            $entry = $this->freezePayload($entry);

            if ($entry->status === SyncStatus::SUPERSEDED) {
                return;
            }

            $targetNode = $this->nodes->find($entry->target_node_id);
            $response = $this->transport->send(
                $targetNode,
                $this->envelope($entry),
            );

            $this->handleResponse($entry, $response);
        } catch (Throwable $exception) {
            $this->markTransportFailure($entry, $exception->getMessage());
        }
    }

    private function claim(string $queueId): ?SyncQueue
    {
        return DB::transaction(function () use ($queueId) {
            $entry = $this->queue->findForUpdate($queueId);

            if (
                ! $entry
                || $entry->status !== SyncStatus::PENDING
                || ($entry->available_at && $entry->available_at->isFuture())
            ) {
                return null;
            }

            return $this->queue->updateEntry($entry, [
                'status' => SyncStatus::PROCESSING,
                'attempts' => $entry->attempts + 1,
                'locked_at' => now(),
                'lock_token' => (string) Str::uuid(),
                'last_error' => null,
            ]);
        });
    }

    private function freezePayload(SyncQueue $entry): SyncQueue
    {
        if ($entry->payload_hash) {
            return $entry;
        }

        $state = $this->states->findByEntity($entry->entity_type, $entry->entity_id);

        if ($state && $state->version > $entry->entity_version) {
            return $this->queue->updateEntry($entry, [
                'status' => SyncStatus::SUPERSEDED,
                'locked_at' => null,
                'lock_token' => null,
            ]);
        }

        $payload = $entry->operation === SyncOperation::DELETED
            ? null
            : $this->entities
                ->resolve($entry->entity_type)
                ->export($entry->entity_id);

        if ($entry->operation !== SyncOperation::DELETED && $payload === null) {
            throw new \RuntimeException(
                "La entidad [{$entry->entity_type}:{$entry->entity_id}] no existe."
            );
        }

        return $this->queue->updateEntry($entry, [
            'base_version' => $state?->synced_version ?? $entry->base_version,
            'payload' => $payload,
            'payload_hash' => $this->hasher->hash($payload),
        ]);
    }

    private function envelope(SyncQueue $entry): array
    {
        return [
            'event_id' => $entry->event_id,
            'entity_type' => $entry->entity_type,
            'entity_id' => $entry->entity_id,
            'operation' => $entry->operation->value,
            'occurred_at' => $entry->occurred_at->utc()->toIso8601String(),
            'origin_node_id' => $entry->origin_node_id,
            'base_version' => $entry->base_version,
            'entity_version' => $entry->entity_version,
            'payload' => $entry->payload,
            'payload_hash' => $entry->payload_hash,
        ];
    }

    private function handleResponse(SyncQueue $entry, Response $response): void
    {
        if ($response->successful()) {
            $remoteVersion = (int) (
                $response->json('data.version')
                ?? $entry->entity_version
            );

            $this->queue->updateEntry($entry, [
                'status' => SyncStatus::SYNCED,
                'remote_version' => $remoteVersion,
                'last_http_status' => $response->status(),
                'synced_at' => now(),
                'locked_at' => null,
                'lock_token' => null,
            ]);

            $state = $this->states->findByEntity($entry->entity_type, $entry->entity_id);
            if ($state) {
                $this->states->updateState($state, [
                    'synced_version' => max($state->synced_version, $entry->entity_version),
                    'content_hash' => $entry->payload_hash,
                ]);
            }

            return;
        }

        if ($response->status() === 409) {
            $entry = $this->queue->updateEntry($entry, [
                'status' => SyncStatus::CONFLICT,
                'remote_version' => $response->json('data.current_version'),
                'last_http_status' => 409,
                'last_error' => $response->json('message', 'Conflicto de versión.'),
                'conflicted_at' => now(),
                'locked_at' => null,
                'lock_token' => null,
            ]);

            $this->conflicts->record(
                $entry,
                (int) ($response->json('data.current_version') ?? 0),
                (string) ($response->json('data.reason') ?? 'version_mismatch'),
                $response->json('data.current_payload'),
                $entry->payload,
            );

            return;
        }

        $this->markTransportFailure(
            $entry,
            $response->body(),
            $response->status(),
            in_array($response->status(), [401, 403, 422], true),
        );
    }

    private function markTransportFailure(
        SyncQueue $entry,
        string $message,
        ?int $httpStatus = null,
        bool $terminal = false,
    ): void {
        $maxAttempts = (int) config('synchronization.transport.max_attempts', 5);
        $failed = $terminal || $entry->attempts >= $maxAttempts;
        $backoff = $this->backoffFor($entry->attempts);

        $this->queue->updateEntry($entry, [
            'status' => $failed ? SyncStatus::FAILED : SyncStatus::PENDING,
            'available_at' => $failed ? null : now()->addSeconds($backoff),
            'last_http_status' => $httpStatus,
            'last_error' => Str::limit($message, 4000, ''),
            'locked_at' => null,
            'lock_token' => null,
        ]);
    }

    private function backoffFor(int $attempt): int
    {
        $backoff = config(
            'synchronization.transport.backoff_seconds',
            [10, 30, 60, 300, 900],
        );

        return (int) ($backoff[min(max($attempt - 1, 0), count($backoff) - 1)] ?? 300);
    }
}
