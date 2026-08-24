<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackingClientCrudTest extends TestCase
{
    use RefreshDatabase;

    private function validClientPayload(array $overrides = []): array
    {
        // 1710034065 es una cedula ecuatoriana valida (formato + digito verificador).
        return array_merge([
            'name' => 'Maria Perez',
            'cedula' => '1710034065',
            'phone' => '0991234567',
        ], $overrides);
    }

    public function test_client_full_crud_cycle(): void
    {
        $create = $this->postJson('/api/v1/tracking/clients', $this->validClientPayload());
        $create->assertStatus(201)->assertJsonPath('data.name', 'Maria Perez');
        $clientId = $create->json('data.id');

        $this->getJson('/api/v1/tracking/clients')->assertStatus(200);

        $this->getJson("/api/v1/tracking/clients/{$clientId}")
            ->assertStatus(200)
            ->assertJsonPath('data.cedula', '1710034065');

        $this->putJson("/api/v1/tracking/clients/{$clientId}", ['phone' => '0987654321'])
            ->assertStatus(200)
            ->assertJsonPath('data.phone', '0987654321');

        $this->deleteJson("/api/v1/tracking/clients/{$clientId}")->assertStatus(204);
        $this->getJson("/api/v1/tracking/clients/{$clientId}")->assertStatus(404);
    }

    public function test_rejects_invalid_cedula_check_digit(): void
    {
        $this->postJson('/api/v1/tracking/clients', $this->validClientPayload(['cedula' => '1710034066']))
            ->assertStatus(422);
    }

    public function test_rejects_name_with_numbers(): void
    {
        $this->postJson('/api/v1/tracking/clients', $this->validClientPayload(['name' => 'Cliente123']))
            ->assertStatus(422);
    }

    public function test_rejects_non_numeric_phone(): void
    {
        $this->postJson('/api/v1/tracking/clients', $this->validClientPayload(['phone' => '099abc4567']))
            ->assertStatus(422);
    }

    public function test_rejects_duplicate_cedula(): void
    {
        $this->postJson('/api/v1/tracking/clients', $this->validClientPayload())->assertStatus(201);

        $this->postJson('/api/v1/tracking/clients', $this->validClientPayload(['name' => 'Otro Nombre']))
            ->assertStatus(422);
    }

    public function test_search_by_name_or_cedula(): void
    {
        $this->postJson('/api/v1/tracking/clients', $this->validClientPayload(['name' => 'Ana Torres', 'cedula' => '1710034065']))
            ->assertStatus(201);
        $this->postJson('/api/v1/tracking/clients', $this->validClientPayload(['name' => 'Luis Vera', 'cedula' => '1723456818']))
            ->assertStatus(201);

        $byName = $this->getJson('/api/v1/tracking/clients?search=Ana')->assertStatus(200);
        $this->assertCount(1, $byName->json('data'));

        $byCedula = $this->getJson('/api/v1/tracking/clients?search=1723456818')->assertStatus(200);
        $this->assertCount(1, $byCedula->json('data'));
    }
}
