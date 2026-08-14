<?php

namespace Tests\Feature;

use App\Modules\Planning\Models\Lot;
use App\Modules\Planning\Models\ProductionGoal;
use App\Modules\Shared\Models\Role;
use App\Modules\Shared\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlanningCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $adminRole->id]));
    }

    private function createVivero(array $overrides = []): int
    {
        return $this->postJson('/api/v1/viveros', array_merge([
            'name' => 'Vivero Central',
            'location' => 'El Carmen, Manabí',
            'responsible' => 'Ana Torres',
        ], $overrides))->json('data.id');
    }

    public function test_vivero_full_crud_cycle(): void
    {
        $create = $this->postJson('/api/v1/viveros', [
            'name' => 'Vivero Norte',
            'location' => 'Zona Norte',
            'responsible' => 'Juan Pérez',
        ]);
        $create->assertStatus(201)->assertJsonPath('data.name', 'Vivero Norte');
        $viveroId = $create->json('data.id');

        $this->getJson('/api/v1/viveros')->assertStatus(200);

        $this->getJson("/api/v1/viveros/{$viveroId}")
            ->assertStatus(200)
            ->assertJsonPath('data.responsible', 'Juan Pérez');

        $this->putJson("/api/v1/viveros/{$viveroId}", ['name' => 'Vivero Norte Renovado'])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Vivero Norte Renovado');

        $this->deleteJson("/api/v1/viveros/{$viveroId}")->assertStatus(204);
        $this->getJson("/api/v1/viveros/{$viveroId}")->assertStatus(404);
    }

    public function test_production_goal_is_created_not_started_without_dates_or_status_input(): void
    {
        $viveroId = $this->createVivero();

        $create = $this->postJson('/api/v1/production-goals', [
            'vivero_id' => $viveroId,
            'title' => 'Meta de prueba',
            'target_seedlings' => 1000,
            // Se intenta colar un estado y fechas — deben ser ignorados por el sistema.
            'status' => 'completed',
            'start_date' => '2020-01-01',
        ]);

        $create->assertStatus(201)
            ->assertJsonPath('data.status', 'not_started')
            ->assertJsonPath('data.vivero.id', $viveroId);
        $this->assertArrayNotHasKey('start_date', $create->json('data'));
    }

    public function test_vivero_cannot_have_two_open_goals_at_once(): void
    {
        $viveroId = $this->createVivero();

        $this->postJson('/api/v1/production-goals', [
            'vivero_id' => $viveroId,
            'title' => 'Meta 1',
            'target_seedlings' => 1000,
        ])->assertStatus(201);

        $this->postJson('/api/v1/production-goals', [
            'vivero_id' => $viveroId,
            'title' => 'Meta 2',
            'target_seedlings' => 500,
        ])->assertStatus(409);
    }

    public function test_goal_can_only_be_deleted_while_not_started(): void
    {
        $viveroId = $this->createVivero();

        $goalId = $this->postJson('/api/v1/production-goals', [
            'vivero_id' => $viveroId,
            'title' => 'Meta eliminable',
            'target_seedlings' => 800,
        ])->json('data.id');

        $this->deleteJson("/api/v1/production-goals/{$goalId}")->assertStatus(204);
    }

    public function test_culminar_flow_and_deletion_rules_by_status(): void
    {
        $viveroId = $this->createVivero();

        $goalId = $this->postJson('/api/v1/production-goals', [
            'vivero_id' => $viveroId,
            'title' => 'Meta con ciclo de vida',
            'target_seedlings' => 500,
        ])->json('data.id');

        // Todavía "not_started": culminar no aplica.
        $this->postJson("/api/v1/production-goals/{$goalId}/culminar")->assertStatus(409);

        ProductionGoal::where('id', $goalId)->update(['status' => 'active']);

        // Activa: ya no se puede eliminar.
        $this->deleteJson("/api/v1/production-goals/{$goalId}")->assertStatus(409);

        // Activa: culminar sí procede.
        $this->postJson("/api/v1/production-goals/{$goalId}/culminar")
            ->assertStatus(200)
            ->assertJsonPath('data.finished_at', fn ($value) => $value !== null);

        // Ya culminada: no se puede editar ni volver a culminar.
        $this->putJson("/api/v1/production-goals/{$goalId}", ['title' => 'Intento de edición'])
            ->assertStatus(409);
        $this->postJson("/api/v1/production-goals/{$goalId}/culminar")->assertStatus(409);

        // El vivero queda libre para una meta nueva.
        $this->postJson('/api/v1/production-goals', [
            'vivero_id' => $viveroId,
            'title' => 'Meta siguiente',
            'target_seedlings' => 300,
        ])->assertStatus(201);
    }

    private function baseLotPayload(int $viveroId, array $overrides = []): array
    {
        return array_merge([
            'vivero_id' => $viveroId,
            'name' => 'Lote de prueba',
            'width' => 5,
            'length' => 5,
            'funda_diameter' => 10, // cm -> 0.1 m
            'corridor_count' => 0,
            'corridor_width' => 0,
        ], $overrides);
    }

    public function test_lot_generates_unique_code_and_calculates_capacity(): void
    {
        $viveroId = $this->createVivero();

        $first = $this->postJson('/api/v1/lots', $this->baseLotPayload($viveroId, ['name' => 'Lote Norte']));
        $first->assertStatus(201);
        $this->assertNotEmpty($first->json('data.code'));
        // 5m / 0.10m = 50 por lado, sin corredores -> 50 x 50 = 2500
        $this->assertSame(2500, $first->json('data.calculated_capacity'));
        $this->assertSame(2500, $first->json('data.total_capacity'));

        $second = $this->postJson('/api/v1/lots', $this->baseLotPayload($viveroId, ['name' => 'Lote Sur']));
        $second->assertStatus(201);
        $this->assertNotEquals($first->json('data.code'), $second->json('data.code'));

        $lotId = $first->json('data.id');
        $this->putJson("/api/v1/lots/{$lotId}", ['name' => 'Lote Norte Renovado'])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Lote Norte Renovado');
    }

    public function test_lot_capacity_calculation_matches_corridor_example(): void
    {
        $viveroId = $this->createVivero();

        // Ejemplo real del negocio: ancho 9m con 4 corredores de 100cm cada uno
        // deja 5m sembrables; largo 10m; funda de 12cm.
        $create = $this->postJson('/api/v1/lots', $this->baseLotPayload($viveroId, [
            'width' => 9,
            'length' => 10,
            'funda_diameter' => 12,
            'corridor_count' => 4,
            'corridor_width' => 100,
        ]));

        $create->assertStatus(201);
        // floor(5 / 0.12) = 41 columnas; floor(10 / 0.12) = 83 filas; 41 * 83 = 3403
        $this->assertSame(3403, $create->json('data.calculated_capacity'));
    }

    public function test_lot_rejects_corridors_wider_than_the_lot(): void
    {
        $viveroId = $this->createVivero();

        $this->postJson('/api/v1/lots', $this->baseLotPayload($viveroId, [
            'width' => 3,
            'corridor_count' => 4,
            'corridor_width' => 100, // 4m de corredores en un lote de 3m de ancho
        ]))->assertStatus(409);
    }

    public function test_lot_capacity_can_be_corrected_within_tolerance_only(): void
    {
        $viveroId = $this->createVivero();
        $lotId = $this->postJson('/api/v1/lots', $this->baseLotPayload($viveroId))->json('data.id');
        // calculated_capacity = 2500; tolerancia 15% = 375 -> rango [2125, 2875]

        $this->patchJson("/api/v1/lots/{$lotId}/capacity", ['total_capacity' => 2600])
            ->assertStatus(200)
            ->assertJsonPath('data.total_capacity', 2600)
            ->assertJsonPath('data.calculated_capacity', 2500);

        $this->patchJson("/api/v1/lots/{$lotId}/capacity", ['total_capacity' => 3000])
            ->assertStatus(409);
    }

    public function test_lot_status_transitions_and_deletion_rules(): void
    {
        $viveroId = $this->createVivero();
        $lotId = $this->postJson('/api/v1/lots', $this->baseLotPayload($viveroId))->json('data.id');

        // "occupied" es exclusivamente automático, nunca manual.
        $this->patchJson("/api/v1/lots/{$lotId}/status", ['current_status' => 'occupied'])->assertStatus(409);

        // Disponible -> no se puede eliminar todavía.
        $this->deleteJson("/api/v1/lots/{$lotId}")->assertStatus(409);

        // Simula que el lote ya está en producción (lo hace realmente LotCycleService al
        // comenzar un ciclo — ver tests/Feature/LotCycleTest.php).
        Lot::where('id', $lotId)->update(['current_status' => 'occupied']);

        // No se puede inactivar un lote ocupado.
        $this->patchJson("/api/v1/lots/{$lotId}/status", ['current_status' => 'inactive'])->assertStatus(409);

        Lot::where('id', $lotId)->update(['current_status' => 'available']);

        // Disponible -> inactivo sí procede.
        $this->patchJson("/api/v1/lots/{$lotId}/status", ['current_status' => 'inactive'])
            ->assertStatus(200)
            ->assertJsonPath('data.current_status', 'inactive');

        // Inactivo -> ahora sí se puede eliminar.
        $this->deleteJson("/api/v1/lots/{$lotId}")->assertStatus(204);
    }

    public function test_lot_position_can_be_updated_for_drag_and_drop(): void
    {
        $viveroId = $this->createVivero();
        $lotId = $this->postJson('/api/v1/lots', $this->baseLotPayload($viveroId))->json('data.id');

        $this->patchJson("/api/v1/lots/{$lotId}/position", ['position_x' => 120.5, 'position_y' => 80])
            ->assertStatus(200)
            ->assertJsonPath('data.position_x', '120.50')
            ->assertJsonPath('data.position_y', '80.00');
    }

    public function test_lot_requires_a_vivero(): void
    {
        $this->postJson('/api/v1/lots', [
            'name' => 'Lote sin vivero',
            'width' => 5,
            'length' => 5,
            'corridor_count' => 0,
        ])->assertStatus(422);
    }

    public function test_production_phase_validation_rejects_duplicate_code_within_the_same_vivero(): void
    {
        $viveroId = $this->createVivero();

        $payload = [
            'vivero_id' => $viveroId,
            'code' => 'CUSTOM',
            'name' => 'Fase personalizada',
            'execution_order' => 7,
            'estimated_duration_days' => 7,
        ];

        $this->postJson('/api/v1/production-phases', $payload)->assertStatus(201);
        $this->postJson('/api/v1/production-phases', $payload)->assertStatus(422);

        // El mismo código en OTRO vivero sí es válido — las fases son por vivero.
        $otherViveroId = $this->createVivero(['name' => 'Otro Vivero']);
        $this->postJson('/api/v1/production-phases', ['vivero_id' => $otherViveroId] + $payload)
            ->assertStatus(201);
    }

    public function test_dispatch_phase_duration_is_not_configurable(): void
    {
        $viveroId = $this->createVivero();
        $despId = collect($this->getJson('/api/v1/production-phases')->json('data'))
            ->firstWhere(fn ($p) => $p['vivero_id'] === $viveroId && $p['code'] === 'DESP')['id'];

        // Intentar cambiar su duración se rechaza como regla de negocio.
        $this->putJson("/api/v1/production-phases/{$despId}", ['estimated_duration_days' => 3])
            ->assertStatus(409);

        // Pero sí se puede seguir editando su descripción.
        $this->putJson("/api/v1/production-phases/{$despId}", ['description' => 'Nueva descripción'])
            ->assertStatus(200)
            ->assertJsonPath('data.description', 'Nueva descripción');
    }
}
