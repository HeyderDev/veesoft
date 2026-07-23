<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackingTest extends TestCase
{
    use RefreshDatabase;

    private function createViveroWithGoal(int $target = 500): array
    {
        $viveroId = $this->postJson('/api/v1/viveros', [
            'name' => 'Vivero Tracking', 'location' => 'El Carmen', 'responsible' => 'Responsable',
        ])->json('data.id');

        $goalId = $this->postJson('/api/v1/production-goals', [
            'vivero_id' => $viveroId, 'title' => 'Meta Tracking', 'target_seedlings' => $target,
        ])->json('data.id');

        return [$viveroId, $goalId];
    }

    private function createLotWithClosedCycle(int $viveroId, string $name = 'Lote Tracking'): int
    {
        $lotId = $this->postJson('/api/v1/lots', [
            'vivero_id' => $viveroId, 'name' => $name,
            'width' => 5, 'length' => 5, 'funda_diameter' => 10,
            'corridor_count' => 0, 'corridor_width' => 0,
        ])->json('data.id');

        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => now()->toDateString()])
            ->assertStatus(201);
        $this->postJson("/api/v1/lots/{$lotId}/cycles/current/terminate-dispatch")->assertStatus(200);

        return $lotId;
    }

    public function test_terminate_dispatch_leaves_the_cycle_pending_until_reported(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $this->createLotWithClosedCycle($viveroId);

        $pending = $this->getJson("/api/v1/tracking/pending-dispatches?vivero_id={$viveroId}")
            ->assertStatus(200);

        $this->assertCount(1, $pending->json('data'));
        $this->assertSame('Lote Tracking', $pending->json('data.0.lot.name'));
    }

    public function test_dispatch_report_creates_the_real_total_and_clears_the_pending_cycle(): void
    {
        [$viveroId, $goalId] = $this->createViveroWithGoal();
        $this->createLotWithClosedCycle($viveroId);

        $lotCycleId = $this->getJson("/api/v1/tracking/pending-dispatches?vivero_id={$viveroId}")
            ->json('data.0.id');

        // Antes de reportar, Tracking no tiene nada que sumar.
        $this->getJson("/api/v1/tracking/dispatch-summary?production_goal_id={$goalId}")
            ->assertJsonPath('data.dispatched_seedlings', 0);

        $this->postJson('/api/v1/tracking/dispatch-reports', [
            'lot_cycle_id' => $lotCycleId, 'quantity' => 250,
        ])->assertStatus(201);

        // El total real ahora viene del reporte, no del cierre de ciclo.
        $this->getJson("/api/v1/tracking/dispatch-summary?production_goal_id={$goalId}")
            ->assertJsonPath('data.dispatched_seedlings', 250);

        // El ciclo ya reportado deja de aparecer como pendiente.
        $this->getJson("/api/v1/tracking/pending-dispatches?vivero_id={$viveroId}")
            ->assertJsonCount(0, 'data');

        // Reportar dos veces el mismo ciclo no es posible.
        $this->postJson('/api/v1/tracking/dispatch-reports', [
            'lot_cycle_id' => $lotCycleId, 'quantity' => 50,
        ])->assertStatus(409);
    }

    public function test_dispatch_report_completes_the_goal_when_target_reached(): void
    {
        [$viveroId, $goalId] = $this->createViveroWithGoal(target: 100);
        $this->createLotWithClosedCycle($viveroId);
        $lotCycleId = $this->getJson("/api/v1/tracking/pending-dispatches?vivero_id={$viveroId}")
            ->json('data.0.id');

        $this->postJson('/api/v1/tracking/dispatch-reports', [
            'lot_cycle_id' => $lotCycleId, 'quantity' => 100,
        ])->assertStatus(201);

        $this->getJson("/api/v1/production-goals/{$goalId}")->assertJsonPath('data.status', 'completed');
    }

    public function test_dispatch_report_rejects_quantity_above_lot_capacity(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $this->createLotWithClosedCycle($viveroId); // capacidad calculada = 2500
        $lotCycleId = $this->getJson("/api/v1/tracking/pending-dispatches?vivero_id={$viveroId}")
            ->json('data.0.id');

        $this->postJson('/api/v1/tracking/dispatch-reports', [
            'lot_cycle_id' => $lotCycleId, 'quantity' => 999999,
        ])->assertStatus(409);
    }

    public function test_dispatch_summary_requires_a_valid_production_goal_id(): void
    {
        $this->getJson('/api/v1/tracking/dispatch-summary')->assertStatus(422);
        $this->getJson('/api/v1/tracking/dispatch-summary?production_goal_id=999999')->assertStatus(422);
    }
}
