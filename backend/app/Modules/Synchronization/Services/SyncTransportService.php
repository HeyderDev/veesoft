<?php

namespace App\Modules\Synchronization\Services;

use App\Modules\Synchronization\Models\SyncNode;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class SyncTransportService
{
    public function send(SyncNode $targetNode, array $envelope): Response
    {
        $baseUrl = $targetNode->base_url;
        $token = config('synchronization.default_target.token');

        if (! $baseUrl) {
            throw new RuntimeException(
                "El nodo destino [{$targetNode->code}] no tiene una URL configurada."
            );
        }

        if (! $token) {
            throw new RuntimeException('SYNC_TARGET_TOKEN no está configurado.');
        }

        return Http::acceptJson()
            ->withToken($token)
            ->timeout((int) config('synchronization.transport.timeout_seconds', 10))
            ->post(
                rtrim($baseUrl, '/').'/api/v1/sync/receive',
                $envelope,
            );
    }
}
