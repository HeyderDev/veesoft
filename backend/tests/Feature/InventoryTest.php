<?php

namespace Tests\Feature;

use App\Modules\Shared\Models\User;
use App\Modules\Inventory\Models\Tool;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_create_tool_and_find_by_code()
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/tools', [
            'name' => 'Martillo',
            'description' => 'Martillo de carpintero',
            'quantity' => 5
        ]);

        $response->assertStatus(201);
        $toolId = $response->json('data.id');
        $code = $response->json('data.code');

        $this->assertNotEmpty($code);

        // Buscar por código
        $responseByCode = $this->actingAs($this->user)->getJson("/api/v1/tools/code/{$code}");
        $responseByCode->assertStatus(200);
        $this->assertEquals($toolId, $responseByCode->json('data.id'));
    }

    public function test_can_update_tool_status_and_create_movement()
    {
        $tool = Tool::create([
            'code' => 'HERR-999',
            'name' => 'Taladro',
            'status' => Tool::STATUS_AVAILABLE,
            'quantity' => 1
        ]);

        $response = $this->actingAs($this->user)->patchJson("/api/v1/tools/{$tool->id}/status", [
            'status' => Tool::STATUS_BORROWED,
            'details' => ['motivo' => 'Préstamo a trabajador']
        ]);

        $response->assertStatus(200);
        $this->assertEquals(Tool::STATUS_BORROWED, $response->json('data.status'));

        // Verificar movimiento
        $movementsResponse = $this->actingAs($this->user)->getJson("/api/v1/movements");
        $movementsResponse->assertStatus(200);
        
        $movements = $movementsResponse->json('data.data') ?? $movementsResponse->json('data');
        if (isset($movements['data'])) {
            $movements = $movements['data'];
        }
        $this->assertNotEmpty($movements);
        $this->assertEquals('BORROWED', $movements[0]['type']);
    }
}
