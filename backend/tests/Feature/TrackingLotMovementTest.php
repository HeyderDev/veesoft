<?php

namespace Tests\Feature;

use App\Modules\Shared\Models\Role;
use App\Modules\Shared\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackingLotMovementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::firstOrCreate(['name' => 'Admin']);
        $this->admin = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($this->admin);
    }

    private function createLot(array $overrides = []): array
    {
        $viveroId = $this->postJson('/api/v1/viveros', [
            'name' => 'Vivero Tracking', 'location' => 'El Carmen', 'responsible' => 'Responsable',
        ])->json('data.id');

        $this->withHeader('X-Vivero-Id', (string) $viveroId);

        $lot = $this->postJson('/api/v1/lots', array_merge([
            'vivero_id' => $viveroId,
            'name' => 'Lote Tracking',
            'width' => 5, 'length' => 5, 'funda_diameter' => 10,
            'corridor_count' => 0, 'corridor_width' => 0,
        ], $overrides))->json('data');

        return [$viveroId, $lot['id'], $lot['total_capacity']];
    }

    private function createClient(array $overrides = []): int
    {
        return $this->postJson('/api/v1/tracking/clients', array_merge([
            'name' => 'Maria Perez',
            'cedula' => '1710034065',
            'phone' => '0991234567',
        ], $overrides))->json('data.id');
    }

    public function test_lots_are_read_from_planning_not_created_here(): void
    {
        [, $lotId] = $this->createLot();

        $lots = $this->getJson('/api/v1/tracking/lots')->assertStatus(200);
        $this->assertTrue(collect($lots->json('data'))->contains('id', $lotId));

        $detail = $this->getJson("/api/v1/tracking/lots/{$lotId}")->assertStatus(200);
        $this->assertSame($lotId, $detail->json('data.lot.id'));
        $this->assertCount(0, $detail->json('data.movements.data'));
    }

    public function test_registering_an_exit_movement_requires_a_client(): void
    {
        [, $lotId] = $this->createLot();

        $this->postJson('/api/v1/tracking/movements', [
            'lot_id' => $lotId,
            'quantity' => 10,
        ])->assertStatus(422);
    }

    public function test_registers_exit_movement_with_client_and_appears_in_lot_history(): void
    {
        [, $lotId] = $this->createLot();
        $clientId = $this->createClient();

        $this->postJson('/api/v1/tracking/movements', [
            'lot_id' => $lotId,
            'tracking_client_id' => $clientId,
            'quantity' => 50,
        ])->assertStatus(201)->assertJsonPath('data.tracking_client_id', $clientId);

        $detail = $this->getJson("/api/v1/tracking/lots/{$lotId}")->assertStatus(200);
        $this->assertCount(1, $detail->json('data.movements.data'));
        $this->assertSame('Maria Perez', $detail->json('data.movements.data.0.tracking_client.name'));
    }

    public function test_exit_quantity_cannot_exceed_lot_capacity(): void
    {
        [, $lotId, $capacity] = $this->createLot();
        $clientId = $this->createClient();

        $this->postJson('/api/v1/tracking/movements', [
            'lot_id' => $lotId,
            'tracking_client_id' => $clientId,
            'quantity' => $capacity + 1,
        ])->assertStatus(409);
    }

    public function test_general_summary_totals_and_top_clients(): void
    {
        [, $lotId] = $this->createLot();
        [, $lotId2] = $this->createLot(['name' => 'Lote Tracking 2']);
        $clientId = $this->createClient();

        $this->postJson('/api/v1/tracking/movements', [
            'lot_id' => $lotId, 'tracking_client_id' => $clientId, 'quantity' => 30,
        ])->assertStatus(201);
        $this->postJson('/api/v1/tracking/movements', [
            'lot_id' => $lotId2, 'tracking_client_id' => $clientId, 'quantity' => 20,
        ])->assertStatus(201);

        $summary = $this->getJson('/api/v1/tracking/summary')->assertStatus(200);
        $this->assertSame(2, $summary->json('data.total_lots'));
        $this->assertSame(50, $summary->json('data.total_dispatched'));
        $this->assertSame('Maria Perez', $summary->json('data.top_clients.0.name'));
        $this->assertSame(50, $summary->json('data.top_clients.0.total_quantity'));
    }

    public function test_lot_summary_includes_movement_history(): void
    {
        [, $lotId] = $this->createLot();
        $clientId = $this->createClient();

        $this->postJson('/api/v1/tracking/movements', [
            'lot_id' => $lotId, 'tracking_client_id' => $clientId, 'quantity' => 15,
        ])->assertStatus(201);

        $report = $this->getJson("/api/v1/tracking/summary/lots/{$lotId}")->assertStatus(200);
        $this->assertSame($lotId, $report->json('data.lot.id'));
        $this->assertCount(1, $report->json('data.movements.data'));
    }
}
