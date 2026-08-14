<?php

namespace App\Modules\Synchronization\Services;

use App\Modules\Synchronization\Enums\SyncOperation;

interface SyncEntityAdapter
{
    public function entityType(): string;

    /**
     * Devuelve el Resource/DTO público de la entidad, nunca el Model sin filtrar.
     */
    public function export(string $entityId): ?array;

    /**
     * Aplica el cambio exclusivamente mediante el Service público del módulo dueño.
     */
    public function apply(
        string $entityId,
        SyncOperation $operation,
        ?array $payload,
    ): void;
}
