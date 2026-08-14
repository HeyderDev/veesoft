<?php

namespace App\Modules\Synchronization\Events;

use App\Modules\Synchronization\Enums\SyncOperation;
use Carbon\CarbonImmutable;

interface SyncableDomainEvent
{
    public function eventId(): string;

    public function entityType(): string;

    public function entityId(): string;

    public function operation(): SyncOperation;

    public function occurredAt(): CarbonImmutable;

    public function originNodeId(): string;
}
