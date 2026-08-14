<?php

namespace App\Modules\Synchronization\Traits;

use App\Modules\Synchronization\Enums\SyncOperation;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;

trait HasSyncMetadata
{
    private string $syncEventId;

    private string $syncEntityType;

    private string $syncEntityId;

    private SyncOperation $syncOperation;

    private CarbonImmutable $syncOccurredAt;

    private string $syncOriginNodeId;

    protected function initializeSyncMetadata(
        string $entityType,
        string|int $entityId,
        SyncOperation $operation,
        ?CarbonImmutable $occurredAt = null,
        ?string $originNodeId = null,
        ?string $eventId = null,
    ): void {
        $this->syncEventId = $eventId ?? (string) Str::uuid();
        $this->syncEntityType = $entityType;
        $this->syncEntityId = (string) $entityId;
        $this->syncOperation = $operation;
        $this->syncOccurredAt = $occurredAt ?? CarbonImmutable::now('UTC');
        $this->syncOriginNodeId = $originNodeId
            ?? (string) config('synchronization.local_node.id');
    }

    public function eventId(): string
    {
        return $this->syncEventId;
    }

    public function entityType(): string
    {
        return $this->syncEntityType;
    }

    public function entityId(): string
    {
        return $this->syncEntityId;
    }

    public function operation(): SyncOperation
    {
        return $this->syncOperation;
    }

    public function occurredAt(): CarbonImmutable
    {
        return $this->syncOccurredAt;
    }

    public function originNodeId(): string
    {
        return $this->syncOriginNodeId;
    }
}
