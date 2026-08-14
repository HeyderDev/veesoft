<?php

namespace Tests\Feature;

use App\Modules\Synchronization\Enums\SyncNodeType;
use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Enums\SyncStatus;
use App\Modules\Synchronization\Events\SyncableDomainEvent;
use App\Modules\Synchronization\Jobs\PushSyncQueueJob;
use App\Modules\Synchronization\Models\SyncNode;
use App\Modules\Synchronization\Models\SyncQueue;
use App\Modules\Synchronization\Services\SyncEntityAdapter;
use App\Modules\Synchronization\Services\SyncEntityRegistry;
use App\Modules\Synchronization\Services\SyncPayloadHasher;
use App\Modules\Synchronization\Traits\HasSyncMetadata;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class SynchronizationTest extends TestCase
{
    use RefreshDatabase;

    private const LOCAL_NODE_ID = '00000000-0000-4000-8000-000000000001';

    private const TARGET_NODE_ID = '00000000-0000-4000-8000-000000000002';

    private const NODE_TOKEN = 'test-node-token';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'synchronization.local_node.id' => self::LOCAL_NODE_ID,
            'synchronization.default_target.id' => self::TARGET_NODE_ID,
            'synchronization.default_target.url' => 'http://central.test',
            'synchronization.default_target.token' => self::NODE_TOKEN,
            'synchronization.transport.max_attempts' => 5,
        ]);

        SyncNode::create([
            'id' => self::LOCAL_NODE_ID,
            'code' => 'administrator-test',
            'name' => 'Administrador Test',
            'node_type' => SyncNodeType::ADMINISTRATOR,
            'is_active' => true,
        ]);

        SyncNode::create([
            'id' => self::TARGET_NODE_ID,
            'code' => 'central-test',
            'name' => 'Central Test',
            'node_type' => SyncNodeType::CENTRAL,
            'base_url' => 'http://central.test',
            'token_hash' => hash('sha256', self::NODE_TOKEN),
            'is_active' => true,
        ]);
    }

    public function test_syncable_domain_event_creates_pending_queue_entry(): void
    {
        event(new TestSyncableEvent('test.entity', 'entity-1', SyncOperation::CREATED));

        $this->assertDatabaseHas('sync_queue', [
            'entity_type' => 'test.entity',
            'entity_id' => 'entity-1',
            'status' => SyncStatus::PENDING->value,
            'base_version' => 0,
            'entity_version' => 1,
        ]);

        $this->assertDatabaseHas('sync_entity_states', [
            'entity_type' => 'test.entity',
            'entity_id' => 'entity-1',
            'origin_node_id' => self::LOCAL_NODE_ID,
            'version' => 1,
            'synced_version' => 0,
        ]);
    }

    public function test_push_job_marks_entry_as_synced_after_successful_delivery(): void
    {
        $adapter = $this->registerAdapter([
            'entity-1' => ['id' => 'entity-1', 'name' => 'Cacao'],
        ]);
        event(new TestSyncableEvent('test.entity', 'entity-1', SyncOperation::CREATED));
        $entry = SyncQueue::query()->firstOrFail();

        Http::fake([
            'http://central.test/api/v1/sync/receive' => Http::response([
                'status' => 'success',
                'message' => 'Cambio sincronizado correctamente.',
                'data' => ['version' => 1],
            ]),
        ]);

        PushSyncQueueJob::dispatchSync($entry->id);

        $this->assertDatabaseHas('sync_queue', [
            'id' => $entry->id,
            'status' => SyncStatus::SYNCED->value,
            'attempts' => 1,
            'last_http_status' => 200,
        ]);
        $this->assertDatabaseHas('sync_entity_states', [
            'entity_type' => 'test.entity',
            'entity_id' => 'entity-1',
            'synced_version' => 1,
        ]);
        $this->assertSame('Cacao', $adapter->export('entity-1')['name']);

        Http::assertSent(fn ($request) => $request['payload']['name'] === 'Cacao'
            && $request['base_version'] === 0
            && $request['entity_version'] === 1);
    }

    public function test_push_job_marks_entry_as_failed_after_terminal_attempt(): void
    {
        config(['synchronization.transport.max_attempts' => 1]);
        $this->registerAdapter([
            'entity-1' => ['id' => 'entity-1', 'name' => 'Cacao'],
        ]);
        event(new TestSyncableEvent('test.entity', 'entity-1', SyncOperation::CREATED));
        $entry = SyncQueue::query()->firstOrFail();

        Http::fake([
            'http://central.test/api/v1/sync/receive' => Http::response(
                ['message' => 'Nodo no disponible'],
                503,
            ),
        ]);

        PushSyncQueueJob::dispatchSync($entry->id);

        $this->assertDatabaseHas('sync_queue', [
            'id' => $entry->id,
            'status' => SyncStatus::FAILED->value,
            'attempts' => 1,
            'last_http_status' => 503,
        ]);
    }

    public function test_receive_endpoint_is_idempotent_and_records_version_conflicts(): void
    {
        $adapter = $this->registerAdapter();
        $payload = ['id' => 'remote-1', 'name' => 'Remoto'];
        $eventId = (string) Str::uuid();
        $envelope = $this->envelope($eventId, $payload, 0, 1);

        $this->withToken(self::NODE_TOKEN)
            ->postJson('/api/v1/sync/receive', $envelope)
            ->assertOk()
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.duplicate', false);

        $this->assertSame('Remoto', $adapter->export('remote-1')['name']);

        $this->withToken(self::NODE_TOKEN)
            ->postJson('/api/v1/sync/receive', $envelope)
            ->assertOk()
            ->assertJsonPath('data.duplicate', true);

        $conflicting = $this->envelope(
            (string) Str::uuid(),
            ['id' => 'remote-1', 'name' => 'Cambio concurrente'],
            0,
            2,
        );

        $this->withToken(self::NODE_TOKEN)
            ->postJson('/api/v1/sync/receive', $conflicting)
            ->assertConflict()
            ->assertJsonPath('data.reason', 'version_mismatch')
            ->assertJsonPath('data.current_version', 1);

        $this->assertDatabaseCount('sync_conflicts', 1);
        $this->assertDatabaseHas('sync_queue', [
            'event_id' => $conflicting['event_id'],
            'status' => SyncStatus::CONFLICT->value,
        ]);
    }

    private function registerAdapter(array $entities = []): TestSyncEntityAdapter
    {
        $adapter = new TestSyncEntityAdapter($entities);
        $this->app->make(SyncEntityRegistry::class)->register($adapter);

        return $adapter;
    }

    private function envelope(
        string $eventId,
        array $payload,
        int $baseVersion,
        int $entityVersion,
    ): array {
        return [
            'event_id' => $eventId,
            'entity_type' => 'test.entity',
            'entity_id' => 'remote-1',
            'operation' => SyncOperation::CREATED->value,
            'occurred_at' => now()->utc()->toIso8601String(),
            'origin_node_id' => self::TARGET_NODE_ID,
            'base_version' => $baseVersion,
            'entity_version' => $entityVersion,
            'payload' => $payload,
            'payload_hash' => $this->app->make(SyncPayloadHasher::class)->hash($payload),
        ];
    }
}

class TestSyncableEvent implements SyncableDomainEvent
{
    use Dispatchable, HasSyncMetadata;

    public function __construct(
        string $entityType,
        string $entityId,
        SyncOperation $operation,
    ) {
        $this->initializeSyncMetadata($entityType, $entityId, $operation);
    }
}

class TestSyncEntityAdapter implements SyncEntityAdapter
{
    public function __construct(private array $entities = []) {}

    public function entityType(): string
    {
        return 'test.entity';
    }

    public function export(string $entityId): ?array
    {
        return $this->entities[$entityId] ?? null;
    }

    public function apply(
        string $entityId,
        SyncOperation $operation,
        ?array $payload,
    ): void {
        if ($operation === SyncOperation::DELETED) {
            unset($this->entities[$entityId]);

            return;
        }

        $this->entities[$entityId] = $payload ?? [];
    }
}
