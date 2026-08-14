<?php

namespace Tests\Feature;

use App\Modules\Planning\Models\Lot;
use App\Modules\Planning\Models\LotCycle;
use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Planning\Models\Vivero;
use App\Modules\Synchronization\Enums\SyncStatus;
use App\Modules\Synchronization\Services\SyncEntityRegistry;
use App\Modules\Tracking\Services\DispatchReportService;
use App\Modules\Tracking\Services\TrackingClientService;
use App\Modules\Tracking\Services\TrackingMovementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackingSynchronizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tracking_writes_enqueue_client_movement_and_dispatch(): void
    {
        $vivero = Vivero::create([
            'name' => 'Vivero Tracking Sync',
            'location' => 'El Carmen',
            'responsible' => 'Responsable',
        ]);
        $goal = ProductionGoal::create([
            'vivero_id' => $vivero->id,
            'title' => 'Meta Tracking Sync',
            'target_seedlings' => 500,
            'status' => ProductionGoal::STATUS_ACTIVE,
        ]);
        $lot = Lot::create([
            'vivero_id' => $vivero->id,
            'code' => 'TRACK-SYNC-1',
            'name' => 'Lote Tracking Sync',
            'funda_diameter' => 10,
            'width' => 5,
            'length' => 5,
            'corridor_count' => 0,
            'corridor_width' => 0,
            'calculated_capacity' => 100,
            'total_capacity' => 100,
            'current_status' => Lot::STATUS_AVAILABLE,
        ]);
        $cycle = LotCycle::create([
            'lot_id' => $lot->id,
            'production_goal_id' => $goal->id,
            'started_at' => '2026-06-01',
            'status' => LotCycle::STATUS_DISPATCHED,
        ]);

        $client = $this->app->make(TrackingClientService::class)->create([
            'name' => 'Ana Zambrano',
            'cedula' => '1311241077',
            'phone' => '0999999999',
        ]);
        $movement = $this->app->make(TrackingMovementService::class)->register([
            'lot_id' => $lot->id,
            'tracking_client_id' => $client->id,
            'quantity' => 10,
        ]);
        $dispatch = $this->app->make(DispatchReportService::class)
            ->createReport($cycle->id, 20, '2026-07-01');

        foreach ([
            'tracking.client' => $client->id,
            'tracking.movement' => $movement->id,
            'tracking.dispatch' => $dispatch->id,
        ] as $entityType => $entityId) {
            $this->assertDatabaseHas('sync_queue', [
                'entity_type' => $entityType,
                'entity_id' => (string) $entityId,
                'status' => SyncStatus::PENDING->value,
            ]);
        }

        $registry = $this->app->make(SyncEntityRegistry::class);
        $this->assertSame(
            'Ana Zambrano',
            $registry->resolve('tracking.client')
                ->export((string) $client->id)['name'],
        );
        $this->assertSame(
            10,
            $registry->resolve('tracking.movement')
                ->export((string) $movement->id)['quantity'],
        );
        $this->assertSame(
            20,
            $registry->resolve('tracking.dispatch')
                ->export((string) $dispatch->id)['quantity'],
        );
    }
}
