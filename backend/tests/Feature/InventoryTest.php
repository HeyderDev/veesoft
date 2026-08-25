<?php

namespace Tests\Feature;

use App\Modules\Inventory\Models\Supply;
use App\Modules\Inventory\Models\Tool;
use App\Modules\Planning\Models\Vivero;
use App\Modules\Shared\Models\Role;
use App\Modules\Shared\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Vivero $vivero;

    protected function setUp(): void
    {
        parent::setUp();

        $this->vivero = Vivero::create(['name' => 'Vivero Central', 'location' => 'El Carmen', 'responsible' => 'Admin Test']);
        $role = Role::create(['name' => 'Admin']);
        $this->user = User::factory()->create(['role_id' => $role->id]);
    }

    private function actingAsAdmin()
    {
        return $this->actingAs($this->user)->withHeader('X-Vivero-Id', (string) $this->vivero->id);
    }

    public function test_can_create_tool_and_find_unit_by_code()
    {
        $response = $this->actingAsAdmin()->postJson('/api/v1/tools', [
            'name' => 'Martillo',
            'category' => 'Manual',
            'quantity' => 2,
        ]);

        $response->assertStatus(201);
        $toolId = $response->json('data.id');

        $detail = $this->actingAsAdmin()->getJson("/api/v1/tools/{$toolId}")->assertStatus(200);
        $units = $detail->json('data.units');
        $this->assertCount(2, $units);
        $code = $units[0]['code'];

        // Buscar unidad por código
        $responseByCode = $this->actingAsAdmin()->getJson("/api/v1/tool-units/code/{$code}");
        $responseByCode->assertStatus(200);
        $this->assertEquals($units[0]['id'], $responseByCode->json('data.id'));
    }

    public function test_can_create_supply_and_register_movement()
    {
        $response = $this->actingAsAdmin()->postJson('/api/v1/supplies', [
            'name' => 'Abono Orgánico',
            'unit' => 'kg',
            'current_stock' => 50,
            'minimum_stock' => 5,
        ]);

        $response->assertStatus(201);
        $supplyId = $response->json('data.id');

        // Registrar salida
        $moveResponse = $this->actingAsAdmin()->postJson("/api/v1/supplies/{$supplyId}/movements", [
            'type' => 'SALIDA',
            'quantity' => 10,
            'reason' => 'Uso en lote A',
        ]);

        $moveResponse->assertStatus(200);
        $this->assertEquals(40, $moveResponse->json('data.supply.current_stock'));
    }
}
