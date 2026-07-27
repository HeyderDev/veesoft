<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackingItemCrudTest extends TestCase
{
    use RefreshDatabase;

    private function createItem(array $overrides = []): int
    {
        return $this->postJson('/api/v1/tracking/items', array_merge([
            'name' => 'Lote 001',
            'species' => 'CCN-51',
            'stage' => 'nursery',
            'quantity' => 50,
            'unit' => 'unidades',
            'location' => 'Vivero Central',
            'minimum_stock' => 10,
        ], $overrides))->json('data.id');
    }

    public function test_tracking_item_full_crud_cycle(): void
    {
        $create = $this->postJson('/api/v1/tracking/items', [
            'name' => 'Lote Norte',
            'species' => 'CCN-51',
            'stage' => 'germination',
            'quantity' => 100,
            'unit' => 'unidades',
            'location' => 'Zona A',
            'minimum_stock' => 20,
        ]);
        $create->assertStatus(201)->assertJsonPath('data.name', 'Lote Norte');
        $itemId = $create->json('data.id');

        $this->getJson('/api/v1/tracking/items')->assertStatus(200);

        $this->getJson("/api/v1/tracking/items/{$itemId}")
            ->assertStatus(200)
            ->assertJsonPath('data.species', 'CCN-51');

        $this->putJson("/api/v1/tracking/items/{$itemId}", ['location' => 'Zona B'])
            ->assertStatus(200)
            ->assertJsonPath('data.location', 'Zona B');

        $this->deleteJson("/api/v1/tracking/items/{$itemId}")->assertStatus(204);
        $this->getJson("/api/v1/tracking/items/{$itemId}")->assertStatus(404);
    }

    public function test_search_and_stage_filters(): void
    {
        $this->createItem(['name' => 'Cacao Norte', 'stage' => 'germination']);
        $this->createItem(['name' => 'Cacao Sur', 'stage' => 'transplant']);

        $bySearch = $this->getJson('/api/v1/tracking/items?search=Norte')->assertStatus(200);
        $this->assertCount(1, $bySearch->json('data'));

        $byStage = $this->getJson('/api/v1/tracking/items?stage=transplant')->assertStatus(200);
        $this->assertCount(1, $byStage->json('data'));
    }

    public function test_entry_movement_increases_quantity(): void
    {
        $itemId = $this->createItem(['quantity' => 50]);

        $this->postJson('/api/v1/tracking/movements', [
            'tracking_item_id' => $itemId,
            'type' => 'entry',
            'quantity' => 30,
        ])->assertStatus(201);

        $this->getJson("/api/v1/tracking/items/{$itemId}")
            ->assertJsonPath('data.quantity', 80);
    }

    public function test_exit_movement_decreases_quantity(): void
    {
        $itemId = $this->createItem(['quantity' => 50]);

        $this->postJson('/api/v1/tracking/movements', [
            'tracking_item_id' => $itemId,
            'type' => 'exit',
            'quantity' => 20,
        ])->assertStatus(201);

        $this->getJson("/api/v1/tracking/items/{$itemId}")
            ->assertJsonPath('data.quantity', 30);
    }

    public function test_exit_movement_cannot_leave_negative_stock(): void
    {
        $itemId = $this->createItem(['quantity' => 10]);

        $this->postJson('/api/v1/tracking/movements', [
            'tracking_item_id' => $itemId,
            'type' => 'exit',
            'quantity' => 999,
        ])->assertStatus(409);

        $this->getJson("/api/v1/tracking/items/{$itemId}")
            ->assertJsonPath('data.quantity', 10);
    }

    public function test_summary_and_stock_alerts(): void
    {
        $this->createItem(['name' => 'Bajo stock', 'quantity' => 5, 'minimum_stock' => 10]);
        $this->createItem(['name' => 'Stock ok', 'quantity' => 100, 'minimum_stock' => 10]);

        $summary = $this->getJson('/api/v1/tracking/summary')->assertStatus(200);
        $this->assertSame(2, $summary->json('data.total_items'));
        $this->assertSame(105, $summary->json('data.total_quantity'));

        $alerts = $this->getJson('/api/v1/tracking/summary/alerts')->assertStatus(200);
        $this->assertCount(1, $alerts->json('data'));
        $this->assertSame('Bajo stock', $alerts->json('data.0.name'));
    }
}
