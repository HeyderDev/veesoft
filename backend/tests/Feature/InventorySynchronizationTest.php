<?php

namespace Tests\Feature;

use App\Modules\Inventory\Models\Movement;
use App\Modules\Inventory\Services\MovementService;
use App\Modules\Synchronization\Enums\SyncStatus;
use App\Modules\Synchronization\Services\SyncEntityRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventorySynchronizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_inventory_movement_enqueues_append_only_record(): void
    {
        $movement = $this->app->make(MovementService::class)->createMovement([
            'type' => Movement::TYPE_ADJUSTMENT,
            'quantity' => 4,
            'details' => ['reason' => 'Prueba de sincronización'],
        ]);

        $this->assertDatabaseHas('sync_queue', [
            'entity_type' => 'inventory.movement',
            'entity_id' => (string) $movement->id,
            'status' => SyncStatus::PENDING->value,
        ]);

        $payload = $this->app->make(SyncEntityRegistry::class)
            ->resolve('inventory.movement')
            ->export((string) $movement->id);

        $this->assertSame(Movement::TYPE_ADJUSTMENT, $payload['type']);
        $this->assertSame('4.00', $payload['quantity']);
    }
}
