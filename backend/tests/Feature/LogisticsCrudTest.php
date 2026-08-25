<?php

namespace Tests\Feature;

use App\Modules\Inventory\Models\Supply;
use App\Modules\Logistics\Models\Supplier;
use App\Modules\Planning\Models\Vivero;
use App\Modules\Shared\Models\Role;
use App\Modules\Shared\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogisticsCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Vivero $vivero;
    private Supply $supply;

    // Cédulas válidas de prueba (Módulo 10 real, no inventadas al azar).
    private const VALID_TAX_ID_1 = '0100000009';
    private const VALID_TAX_ID_2 = '1300000005';

    protected function setUp(): void
    {
        parent::setUp();

        $this->vivero = Vivero::create(['name' => 'Vivero Central', 'location' => 'El Carmen', 'responsible' => 'Admin Test']);
        $role = Role::create(['name' => 'Admin']);
        $this->admin = User::factory()->create(['role_id' => $role->id]);
        $this->supply = Supply::create([
            'vivero_id' => $this->vivero->id,
            'name' => 'Sustrato Universal',
            'sku' => 'SUST-01',
            'unit' => 'saco',
            'current_stock' => 100,
            'total_stock' => 100,
            'minimum_stock' => 10,
        ]);
    }

    private function actingAsAdmin()
    {
        return $this->actingAs($this->admin)->withHeader('X-Vivero-Id', (string) $this->vivero->id);
    }

    private function createSupplier(array $overrides = []): int
    {
        $response = $this->actingAsAdmin()->postJson('/api/v1/suppliers', array_merge([
            'name' => 'Agroinsumos El Carmen',
            'tax_id' => self::VALID_TAX_ID_1,
            'email' => 'ventas@agroinsumos.test',
        ], $overrides));

        $supplierId = $response->json('data.id');

        // Asociar el insumo al catálogo del proveedor
        $supplier = Supplier::find($supplierId);
        $supplier->supplies()->attach($this->supply->id, ['unit_price' => 5.00]);

        return $supplierId;
    }

    private function evaluateSupplier(int $supplierId, int $rating = 5): void
    {
        $this->actingAsAdmin()->postJson("/api/v1/suppliers/{$supplierId}/evaluate", [
            'compliance' => $rating,
            'quality' => $rating,
            'punctuality' => $rating,
            'price' => $rating,
            'after_sales_service' => $rating,
        ])->assertStatus(200);
    }

    public function test_supplier_full_crud_cycle(): void
    {
        $create = $this->actingAsAdmin()->postJson('/api/v1/suppliers', [
            'name' => 'Vivero Insumos SA',
            'tax_id' => self::VALID_TAX_ID_2,
        ]);
        $create->assertStatus(201)->assertJsonPath('data.name', 'Vivero Insumos SA');
        $supplierId = $create->json('data.id');

        $this->actingAsAdmin()->getJson('/api/v1/suppliers')->assertStatus(200);
        $this->actingAsAdmin()->getJson("/api/v1/suppliers/{$supplierId}")->assertStatus(200);

        $this->actingAsAdmin()->putJson("/api/v1/suppliers/{$supplierId}", ['name' => 'Vivero Insumos Renovado'])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Vivero Insumos Renovado');

        $this->actingAsAdmin()->deleteJson("/api/v1/suppliers/{$supplierId}")->assertStatus(204);
        $this->actingAsAdmin()->getJson("/api/v1/suppliers/{$supplierId}")->assertStatus(404);
    }

    public function test_supplier_creation_rejects_invalid_tax_id(): void
    {
        $this->actingAsAdmin()->postJson('/api/v1/suppliers', [
            'name' => 'Proveedor Inválido',
            'tax_id' => '9999999999',
        ])->assertStatus(409);
    }

    public function test_supplier_evaluation_recalculates_weighted_score(): void
    {
        $supplierId = $this->createSupplier();

        $response = $this->actingAsAdmin()->postJson("/api/v1/suppliers/{$supplierId}/evaluate", [
            'compliance' => 3,
            'quality' => 4,
            'punctuality' => 5,
            'price' => 2,
            'after_sales_service' => 5,
        ]);

        // 4*0.40 + 5*0.30 + 2*0.20 + 5*0.10 = 1.6 + 1.5 + 0.4 + 0.5 = 4.00
        $response->assertStatus(200)->assertJsonPath('data.score', '4.00');
    }

    public function test_purchase_order_allows_low_score_supplier_but_requires_active_status(): void
    {
        $supplierId = $this->createSupplier();

        // Score por defecto es 5.00 (máximo) hasta la primera evaluación real.
        $this->actingAsAdmin()->getJson("/api/v1/suppliers/{$supplierId}")->assertJsonPath('data.score', '5.00');

        // Una mala evaluación baja el score por debajo del mínimo (3.00) — 2026-08-24: eso
        // ya no bloquea la orden, solo queda como advertencia visual en el frontend.
        $this->evaluateSupplier($supplierId, rating: 1);

        $this->actingAsAdmin()->postJson('/api/v1/purchase-orders', [
            'supplier_id' => $supplierId,
            'items' => [
                ['item_type' => 'supply', 'item_id' => $this->supply->id, 'quantity' => 10],
            ],
        ])->assertStatus(201)
            ->assertJsonPath('data.total', '50.00')
            ->assertJsonPath('data.status', 'issued');

        // Un proveedor inactivo sí sigue bloqueando la orden.
        $this->actingAsAdmin()->putJson("/api/v1/suppliers/{$supplierId}", ['status' => 'inactive'])->assertStatus(200);

        $this->actingAsAdmin()->postJson('/api/v1/purchase-orders', [
            'supplier_id' => $supplierId,
            'items' => [
                ['item_type' => 'supply', 'item_id' => $this->supply->id, 'quantity' => 10],
            ],
        ])->assertStatus(409);
    }

    public function test_purchase_order_receive_updates_status_and_only_once(): void
    {
        $supplierId = $this->createSupplier();
        $this->evaluateSupplier($supplierId);

        $orderId = $this->actingAsAdmin()->postJson('/api/v1/purchase-orders', [
            'supplier_id' => $supplierId,
            'items' => [
                ['item_type' => 'supply', 'item_id' => $this->supply->id, 'quantity' => 10],
            ],
        ])->json('data.id');

        $receive = $this->actingAsAdmin()->postJson("/api/v1/purchase-orders/{$orderId}/receive", [
            'quality_status' => 'approved',
        ]);
        $receive->assertStatus(200)
            ->assertJsonPath('data.order.status', 'received');

        $this->actingAsAdmin()->postJson("/api/v1/purchase-orders/{$orderId}/receive", [
            'quality_status' => 'approved',
        ])->assertStatus(409);
    }

    public function test_pending_deliveries_are_classified_by_urgency(): void
    {
        $supplierId = $this->createSupplier();
        $this->evaluateSupplier($supplierId);

        $this->actingAsAdmin()->postJson('/api/v1/purchase-orders', [
            'supplier_id' => $supplierId,
            'estimated_delivery_date' => now()->toDateString(),
            'items' => [['item_type' => 'supply', 'item_id' => $this->supply->id, 'quantity' => 5]],
        ])->assertStatus(201);

        $this->actingAsAdmin()->postJson('/api/v1/purchase-orders', [
            'supplier_id' => $supplierId,
            'estimated_delivery_date' => now()->addDays(10)->toDateString(),
            'items' => [['item_type' => 'supply', 'item_id' => $this->supply->id, 'quantity' => 2]],
        ])->assertStatus(201);

        $pending = $this->actingAsAdmin()->getJson('/api/v1/purchase-orders/pending-deliveries')->assertStatus(200);
        $items = collect($pending->json('data'));

        $this->assertNotEmpty($items);
        $this->assertTrue($items->contains('urgency', 'red'));
        $this->assertTrue($items->contains('urgency', 'green'));
    }
}
