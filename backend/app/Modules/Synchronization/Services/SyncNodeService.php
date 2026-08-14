<?php

namespace App\Modules\Synchronization\Services;

use App\Modules\Synchronization\Enums\SyncNodeType;
use App\Modules\Synchronization\Models\SyncNode;
use App\Modules\Synchronization\Repositories\Contracts\SyncNodeRepositoryInterface;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Str;

class SyncNodeService
{
    public function __construct(
        private readonly SyncNodeRepositoryInterface $nodes,
    ) {}

    /**
     * @return array{node: SyncNode, token: string}
     */
    public function register(
        string $code,
        string $name,
        SyncNodeType $type,
        ?string $baseUrl = null,
        ?string $id = null,
    ): array {
        $plainToken = Str::random(64);
        $nodeId = $id ?? (string) Str::uuid();

        $node = $this->nodes->updateOrCreate(
            ['id' => $nodeId],
            [
                'code' => $code,
                'name' => $name,
                'node_type' => $type,
                'base_url' => $baseUrl,
                'token_hash' => hash('sha256', $plainToken),
                'token_prefix' => substr($plainToken, 0, 12),
                'is_active' => true,
            ],
        );

        return ['node' => $node, 'token' => $plainToken];
    }

    public function authenticate(string $nodeId, ?string $plainToken): SyncNode
    {
        $node = $this->nodes->findActive($nodeId);

        if (
            ! $node
            || ! $plainToken
            || ! $node->token_hash
            || ! hash_equals($node->token_hash, hash('sha256', $plainToken))
        ) {
            throw new AuthenticationException('Credenciales de nodo inválidas.');
        }

        return $this->nodes->updateNode($node, ['last_seen_at' => now()]);
    }

    public function ensureConfiguredNodes(): void
    {
        $local = config('synchronization.local_node');
        $target = config('synchronization.default_target');

        $this->nodes->updateOrCreate(
            ['id' => $local['id']],
            [
                'code' => $local['code'],
                'name' => $local['name'],
                'node_type' => SyncNodeType::from($local['type']),
                'is_active' => true,
            ],
        );

        if ($target['id'] !== $local['id']) {
            $this->nodes->updateOrCreate(
                ['id' => $target['id']],
                [
                    'code' => $target['code'],
                    'name' => $target['name'],
                    'node_type' => SyncNodeType::from($target['type']),
                    'base_url' => $target['url'],
                    'is_active' => true,
                ],
            );
        }
    }
}
