<?php

namespace Tests\Feature;

use App\Modules\Planning\Models\Lot;
use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Models\ProductionPhase;
use App\Modules\Planning\Models\Vivero;
use App\Modules\Planning\Services\LotCycleService;
use App\Modules\Synchronization\Enums\SyncOperation;
use App\Modules\Synchronization\Enums\SyncStatus;
use App\Modules\Synchronization\Services\SyncEntityRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanningSynchronizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_starting_cycle_enqueues_aggregate_with_phases(): void
    {
        $vivero = Vivero::create([
            'name' => 'Vivero sincronizable',
            'location' => 'El Carmen',
            'responsible' => 'Responsable',
        ]);
        $goal = ProductionGoal::create([
            'vivero_id' => $vivero->id,
            'title' => 'Meta sincronizable',
            'target_seedlings' => 100,
            'status' => ProductionGoal::STATUS_NOT_STARTED,
        ]);
        $lot = Lot::create([
            'vivero_id' => $vivero->id,
            'code' => 'SYNC-LOT-1',
            'name' => 'Lote sincronizable',
            'funda_diameter' => 10,
            'width' => 5,
            'length' => 5,
            'corridor_count' => 0,
            'corridor_width' => 0,
            'calculated_capacity' => 100,
            'total_capacity' => 100,
            'current_status' => Lot::STATUS_AVAILABLE,
        ]);
        ProductionPhase::create([
            'vivero_id' => $vivero->id,
            'code' => 'PREP',
            'name' => 'Preparación',
            'execution_order' => 1,
            'estimated_duration_days' => 7,
        ]);

        $cycle = $this->app->make(LotCycleService::class)
            ->startCycle($lot->id, '2026-08-01');

        $this->assertDatabaseHas('sync_queue', [
            'entity_type' => 'planning.lot-cycle',
            'entity_id' => (string) $cycle->id,
            'status' => SyncStatus::PENDING->value,
        ]);
        $this->assertDatabaseHas('sync_queue', [
            'entity_type' => 'planning.lot',
            'entity_id' => (string) $lot->id,
            'status' => SyncStatus::PENDING->value,
        ]);

        $adapter = $this->app->make(SyncEntityRegistry::class)
            ->resolve('planning.lot-cycle');
        $payload = $adapter->export((string) $cycle->id);

        $this->assertSame($goal->id, $payload['production_goal_id']);
        $this->assertCount(1, $payload['phases']);

        $adapter->apply((string) $cycle->id, SyncOperation::DELETED, null);
        $this->assertDatabaseMissing('lot_cycles', ['id' => $cycle->id]);

        $adapter->apply((string) $cycle->id, SyncOperation::CREATED, $payload);
        $this->assertDatabaseHas('lot_cycles', [
            'id' => $cycle->id,
            'status' => $cycle->status,
        ]);
        $this->assertDatabaseHas('lot_cycle_phases', [
            'id' => $payload['phases'][0]['id'],
            'lot_cycle_id' => $cycle->id,
        ]);
    }
}
