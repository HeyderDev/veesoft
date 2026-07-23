<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SummaryTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_summary_reflects_lot_status_and_goal_progress(): void
    {
        $viveroId = $this->postJson('/api/v1/viveros', [
            'name' => 'Vivero Resumen', 'location' => 'El Carmen', 'responsible' => 'Responsable',
        ])->json('data.id');

        $goalId = $this->postJson('/api/v1/production-goals', [
            'vivero_id' => $viveroId, 'title' => 'Meta Resumen', 'target_seedlings' => 100,
        ])->json('data.id');

        $lotId = $this->postJson('/api/v1/lots', [
            'vivero_id' => $viveroId, 'name' => 'Lote Resumen',
            'width' => 5, 'length' => 5, 'funda_diameter' => 10,
            'corridor_count' => 0, 'corridor_width' => 0,
        ])->json('data.id'); // capacidad = 2500

        // Antes de comenzar cualquier ciclo: sin meta abierta consumida, lote disponible.
        $initial = $this->getJson("/api/v1/viveros/{$viveroId}/summary");
        $initial->assertStatus(200);
        $initial->assertJsonPath('data.open_goal.id', $goalId);
        $initial->assertJsonPath('data.open_goal.produced_seedlings', 0);
        $initial->assertJsonPath('data.lot_status_counts.available', 1);
        $initial->assertJsonPath('data.available_capacity', 2500);
        $initial->assertJsonPath('data.production_capacity', 0);
        $this->assertCount(6, $initial->json('data.phase_distribution'));

        // Se comienza el ciclo con "hoy" cayendo dentro de SIEM (01-08 .. 01-10).
        Carbon::setTestNow('2026-01-09');
        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])->assertStatus(201);

        $inSowing = $this->getJson("/api/v1/viveros/{$viveroId}/summary");
        $inSowing->assertJsonPath('data.lot_status_counts.occupied', 1);
        $inSowing->assertJsonPath('data.lot_status_counts.available', 0);
        $inSowing->assertJsonPath('data.production_capacity', 2500);

        $siembra = collect($inSowing->json('data.phase_distribution'))->firstWhere('code', 'SIEM');
        $this->assertSame(2500, $siembra['capacity']);
        $preparacion = collect($inSowing->json('data.phase_distribution'))->firstWhere('code', 'PREP');
        $this->assertSame(0, $preparacion['capacity']);

        // Se cierra el ciclo (libera el lote) y luego, por separado, Tracking reporta
        // 100 plántulas realmente despachadas (alcanza el objetivo) el mismo día simulado.
        $this->postJson("/api/v1/lots/{$lotId}/cycles/current/terminate-dispatch")->assertStatus(200);
        $lotCycleId = $this->getJson("/api/v1/tracking/pending-dispatches?vivero_id={$viveroId}")->json('data.0.id');
        $this->postJson('/api/v1/tracking/dispatch-reports', ['lot_cycle_id' => $lotCycleId, 'quantity' => 100])
            ->assertStatus(201);

        $afterDispatch = $this->getJson("/api/v1/viveros/{$viveroId}/summary");
        $afterDispatch->assertJsonPath('data.open_goal.produced_seedlings', 100);
        $afterDispatch->assertJsonPath('data.open_goal.status', 'completed');
        $afterDispatch->assertJsonPath('data.lot_status_counts.available', 1);
        $afterDispatch->assertJsonPath('data.production_capacity', 0);

        $totalActual = collect($afterDispatch->json('data.projection_vs_reality'))->sum('actual');
        $this->assertSame(100, $totalActual);
        $this->assertCount(12, $afterDispatch->json('data.projection_vs_reality'));
    }
}
