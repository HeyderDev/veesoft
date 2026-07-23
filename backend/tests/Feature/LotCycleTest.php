<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LotCycleTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function createViveroWithGoal(): array
    {
        $viveroId = $this->postJson('/api/v1/viveros', [
            'name' => 'Vivero Ciclo',
            'location' => 'El Carmen',
            'responsible' => 'Responsable',
        ])->json('data.id');

        $goalId = $this->postJson('/api/v1/production-goals', [
            'vivero_id' => $viveroId,
            'title' => 'Meta del ciclo',
            'target_seedlings' => 100,
        ])->json('data.id');

        return [$viveroId, $goalId];
    }

    private function createLot(int $viveroId, array $overrides = []): int
    {
        return $this->postJson('/api/v1/lots', array_merge([
            'vivero_id' => $viveroId,
            'name' => 'Lote de prueba',
            'width' => 5,
            'length' => 5,
            'funda_diameter' => 10,
            'corridor_count' => 0,
            'corridor_width' => 0,
        ], $overrides))->json('data.id');
    }

    public function test_two_lots_have_fully_independent_calendars(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $lotA = $this->createLot($viveroId, ['name' => 'Lote A']);
        $lotB = $this->createLot($viveroId, ['name' => 'Lote B']);

        $responseA = $this->postJson("/api/v1/lots/{$lotA}/cycles", ['started_at' => '2026-01-01']);
        $responseB = $this->postJson("/api/v1/lots/{$lotB}/cycles", ['started_at' => '2026-03-01']);

        $responseA->assertStatus(201);
        $responseB->assertStatus(201);

        $phasesA = $responseA->json('data.phases');
        $phasesB = $responseB->json('data.phases');

        $this->assertSame('2026-01-01', $phasesA[0]['planned_start_date']);
        $this->assertSame('2026-01-07', $phasesA[0]['planned_end_date']);

        $this->assertSame('2026-03-01', $phasesB[0]['planned_start_date']);
        $this->assertSame('2026-03-07', $phasesB[0]['planned_end_date']);

        // Re-consultar ambos lotes por separado confirma que cada uno conserva su
        // propio calendario, sin mezclarse.
        $refetchA = $this->getJson("/api/v1/lots/{$lotA}")->json('data.active_cycle.phases');
        $refetchB = $this->getJson("/api/v1/lots/{$lotB}")->json('data.active_cycle.phases');
        $this->assertSame('2026-01-01', $refetchA[0]['planned_start_date']);
        $this->assertSame('2026-03-01', $refetchB[0]['planned_start_date']);
    }

    public function test_starting_a_cycle_from_a_chosen_phase_skips_earlier_phases(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $lotId = $this->createLot($viveroId);

        $siembraId = $this->getJson('/api/v1/production-phases')
            ->json('data')[1]['id']; // SIEM, execution_order 2

        $response = $this->postJson("/api/v1/lots/{$lotId}/cycles", [
            'started_at' => '2026-01-01',
            'starting_phase_id' => $siembraId,
        ]);

        $response->assertStatus(201);
        $phases = $response->json('data.phases');

        // Solo 5 fases (de las 6): arranca directo en Siembra, sin Preparación.
        $this->assertCount(5, $phases);
        $this->assertSame('SIEM', $phases[0]['phase']['code']);
        $this->assertSame('2026-01-01', $phases[0]['planned_start_date']);
    }

    public function test_changing_vivero_phase_duration_reschedules_only_from_each_lots_current_phase(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $lotId = $this->createLot($viveroId);

        Carbon::setTestNow('2026-01-20'); // dentro de CREC_INI (01-11..02-09, 30 días)
        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])->assertStatus(201);

        $crecInicialId = $this->getJson('/api/v1/production-phases')->json('data')[2]['id'];

        // Se cambia la duración de PREP (fase ya transcurrida para este lote) y de
        // CREC_INI (fase actual), ambas del mismo vivero: PREP no debe tocar nada ya
        // pasado; CREC_INI sí debe recalcular su fin y en cascada todo lo posterior,
        // sin mover su inicio.
        $prepId = $this->getJson('/api/v1/production-phases')->json('data')[0]['id'];
        $this->putJson("/api/v1/production-phases/{$prepId}", ['estimated_duration_days' => 99])->assertStatus(200);
        $this->putJson("/api/v1/production-phases/{$crecInicialId}", ['estimated_duration_days' => 10])->assertStatus(200);

        $phases = $this->getJson("/api/v1/lots/{$lotId}")->json('data.active_cycle.phases');

        // PREP y SIEM (ya transcurridas) no se tocan pese al cambio de duración de PREP.
        $this->assertSame('2026-01-01', $phases[0]['planned_start_date']);
        $this->assertSame('2026-01-07', $phases[0]['planned_end_date']);
        $this->assertSame('2026-01-08', $phases[1]['planned_start_date']);
        $this->assertSame('2026-01-10', $phases[1]['planned_end_date']);

        // CREC_INI conserva su inicio real (01-11) pero su fin ahora usa la nueva
        // duración (10 días en vez de 30).
        $this->assertSame('2026-01-11', $phases[2]['planned_start_date']);
        $this->assertSame('2026-01-20', $phases[2]['planned_end_date']);

        // La fase siguiente (INJER) se recalcula en cascada a partir de ese nuevo fin.
        $this->assertSame('2026-01-21', $phases[3]['planned_start_date']);
    }

    public function test_starting_a_cycle_requires_an_open_goal(): void
    {
        $viveroId = $this->postJson('/api/v1/viveros', [
            'name' => 'Vivero sin meta', 'location' => 'x', 'responsible' => 'x',
        ])->json('data.id');
        $lotId = $this->createLot($viveroId);

        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])
            ->assertStatus(409);
    }

    public function test_starting_a_cycle_calculates_calendar_and_activates_goal(): void
    {
        [$viveroId, $goalId] = $this->createViveroWithGoal();
        $lotId = $this->createLot($viveroId);

        $this->getJson("/api/v1/production-goals/{$goalId}")->assertJsonPath('data.status', 'not_started');

        $create = $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01']);
        $create->assertStatus(201);
        $phases = $create->json('data.phases');
        $this->assertCount(6, $phases);

        // Mismo cálculo de días que ya se probó en Planning: PREP 7 días (1-7), SIEM 3 días (8-10).
        $this->assertSame('2026-01-01', $phases[0]['planned_start_date']);
        $this->assertSame('2026-01-07', $phases[0]['planned_end_date']);
        $this->assertSame('2026-01-08', $phases[1]['planned_start_date']);
        $this->assertSame('2026-01-10', $phases[1]['planned_end_date']);

        // El lote queda ocupado.
        $this->getJson("/api/v1/lots/{$lotId}")->assertJsonPath('data.current_status', 'occupied');

        // La meta pasa a activa automáticamente.
        $this->getJson("/api/v1/production-goals/{$goalId}")->assertJsonPath('data.status', 'active');
    }

    public function test_dispatch_phase_has_no_end_date_and_remains_current_indefinitely(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $lotId = $this->createLot($viveroId);

        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])->assertStatus(201);

        $phases = $this->getJson("/api/v1/lots/{$lotId}")->json('data.active_cycle.phases');
        $desp = collect($phases)->firstWhere('phase.code', 'DESP');
        $this->assertNull($desp['planned_end_date']);

        // Mucho después de que el cálculo antiguo (duración fija) la habría dado por
        // terminada: Despacho sigue siendo la fase actual, el lote sigue "occupied" y
        // Terminar Despacho todavía es posible — no desaparece la opción.
        Carbon::setTestNow('2026-12-31');
        $lot = $this->getJson("/api/v1/lots/{$lotId}")->json('data');
        $this->assertSame('DESP', $lot['active_cycle']['current_phase']['phase']['code']);
        $this->assertSame('occupied', $lot['current_status']);

        $this->postJson("/api/v1/lots/{$lotId}/cycles/current/terminate-dispatch")
            ->assertStatus(200)
            ->assertJsonPath('data.current_status', 'available');
    }

    public function test_cannot_start_a_second_cycle_on_an_occupied_lot(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $lotId = $this->createLot($viveroId);

        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])->assertStatus(201);
        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])->assertStatus(409);
    }

    public function test_terminate_dispatch_frees_lot_without_recording_a_quantity(): void
    {
        [$viveroId, $goalId] = $this->createViveroWithGoal(); // target_seedlings = 100
        $lotId = $this->createLot($viveroId);

        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])->assertStatus(201);

        // Sin ciclo activo en otro lote, terminar-despacho debe fallar.
        $otherLotId = $this->createLot($viveroId, ['name' => 'Lote sin ciclo']);
        $this->postJson("/api/v1/lots/{$otherLotId}/cycles/current/terminate-dispatch")->assertStatus(409);

        // Cierra el ciclo: el lote queda disponible de nuevo, pero no se crea ningún
        // despacho ni se completa la meta — eso solo lo hace un reporte en Tracking
        // (ver TrackingTest).
        $this->postJson("/api/v1/lots/{$lotId}/cycles/current/terminate-dispatch")
            ->assertStatus(200)
            ->assertJsonPath('data.current_status', 'available');

        $this->getJson("/api/v1/production-goals/{$goalId}")->assertJsonPath('data.status', 'active');

        // El lote, ya libre, puede iniciar un nuevo ciclo de inmediato.
        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-02-01'])->assertStatus(201);
    }

    public function test_reschedule_moves_to_next_phase_and_cascades_following_phases(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $lotId = $this->createLot($viveroId);

        Carbon::setTestNow('2026-01-05'); // dentro de PREP (01-01..01-07)
        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])->assertStatus(201);

        // Se atrasa el paso de PREP a SIEM: en vez de terminar el 01-07, termina el 01-10.
        $response = $this->postJson("/api/v1/lots/{$lotId}/cycles/current/reschedule", [
            'transition_date' => '2026-01-10',
        ]);

        $response->assertStatus(200);
        $phases = $response->json('data.phases');

        $this->assertSame('PREP', $phases[0]['phase']['code']);
        $this->assertSame('2026-01-01', $phases[0]['planned_start_date']);
        $this->assertSame('2026-01-10', $phases[0]['planned_end_date']);

        // SIEM (3 días) arranca al día siguiente de la nueva transición.
        $this->assertSame('SIEM', $phases[1]['phase']['code']);
        $this->assertSame('2026-01-11', $phases[1]['planned_start_date']);
        $this->assertSame('2026-01-13', $phases[1]['planned_end_date']);

        // CREC_INI (30 días) se recalcula en cascada a partir del nuevo fin de SIEM.
        $this->assertSame('2026-01-14', $phases[2]['planned_start_date']);
        $this->assertSame('2026-02-12', $phases[2]['planned_end_date']);
    }

    public function test_reschedule_rejects_transition_date_before_current_phase_start(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $lotId = $this->createLot($viveroId);

        Carbon::setTestNow('2026-01-05');
        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])->assertStatus(201);

        $this->postJson("/api/v1/lots/{$lotId}/cycles/current/reschedule", [
            'transition_date' => '2025-12-31',
        ])->assertStatus(409);
    }

    public function test_reschedule_rejects_when_current_phase_has_no_next_phase(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $lotId = $this->createLot($viveroId);

        // Sin fijar "hoy": la fecha real ya deja el ciclo en su última fase (Despacho).
        $this->postJson("/api/v1/lots/{$lotId}/cycles", ['started_at' => '2026-01-01'])->assertStatus(201);

        $this->postJson("/api/v1/lots/{$lotId}/cycles/current/reschedule", [
            'transition_date' => '2026-05-01',
        ])->assertStatus(409);
    }

    public function test_reschedule_requires_an_active_cycle(): void
    {
        [$viveroId] = $this->createViveroWithGoal();
        $lotId = $this->createLot($viveroId);

        $this->postJson("/api/v1/lots/{$lotId}/cycles/current/reschedule", [
            'transition_date' => '2026-01-05',
        ])->assertStatus(409);
    }
}
