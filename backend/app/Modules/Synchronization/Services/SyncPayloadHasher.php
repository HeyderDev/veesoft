<?php

namespace App\Modules\Synchronization\Services;

use RuntimeException;

class SyncPayloadHasher
{
    public function hash(?array $payload): string
    {
        $encoded = json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE
            | JSON_UNESCAPED_SLASHES
            | JSON_PRESERVE_ZERO_FRACTION
            | JSON_THROW_ON_ERROR,
        );

        if ($encoded === false) {
            throw new RuntimeException('No fue posible serializar el payload de sincronización.');
        }

        return hash('sha256', $encoded);
    }
}
