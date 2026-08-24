<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogisticsCrudTest extends TestCase
{
    use RefreshDatabase;

    // Cédulas válidas de prueba (Módulo 10 real, no inventadas al azar).
    private const VALID_TAX_ID_1 = '0100000009';

    private const VALID_TAX_ID_2 = '1300000005';

    private function createSupplier(array $overrides = []): int
    {
        return $this->postJson('/api/v1/suppliers', array_merge([
            'name' => 'Agroinsumos El Carmen',
            'tax_id' => self::VALID_TAX_ID_1,
            'email' => 'ventas@agroinsumos.test',
        ], $overrides))->json('data.id');
    }

    private function evaluateSupplier(int $supplierId, int $rating = 5): void
    {
        $this->postJson("/api/v1/suppliers/{$supplierId}/evaluate", [
            'compliance' => $rating,
            'quality' => $rating,
            'punctuality' => $rating,
            'price' => $rating,
            'after_sales_service' => $rating,
        ])->assertStatus(200);
    }

    public function test_supplier_full_crud_cycle(): void
    {
        $create = $this->postJson('/api/v1/suppliers', [
            'name' => 'Vivero Insumos SA',
            'tax_id' => self::VALID_TAX_ID_2,
        ]);
        $create->assertStatus(201)->assertJsonPath('data.name', 'Vivero Insumos SA');
        $supplierId = $create->json('data.id');

        $this->getJson('/api/v1/suppliers')->assertStatus(200);
        $this->getJson("/api/v1/suppliers/{$supplierId}")->assertStatus(200);

        $this->putJson("/api/v1/suppliers/{$supplierId}", ['name' => 'Vivero Insumos Renovado'])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Vivero Insumos Renovado');

        $this->deleteJson("/api/v1/suppliers/{$supplierId}")->assertStatus(204);
        $this->getJson("/api/v1/suppliers/{$supplierId}")->assertStatus(404);
    }

    public function test_supplier_creation_rejects_invalid_tax_id(): void
    {
        $this->postJson('/api/v1/suppliers', [
            'name' => 'Proveedor Inválido',
            'tax_id' => '9999999999',
        ])->assertStatus(409);
    }

    public function test_supplier_evaluation_recalculates_weighted_score(): void
    {
        $supplierId = $this->createSupplier();

        $response = $this->postJson("/api/v1/suppliers/{$supplierId}/evaluate", [
            'compliance' => 3,
            'quality' => 4,
            'punctuality' => 5,
            'price' => 2,
            'after_sales_service' => 5,
        ]);

        // 4*0.40 + 5*0.30 + 2*0.20 + 5*0.10 = 1.6 + 1.5 + 0.4 + 0.5 = 4.00
        $response->assertStatus(200)->assertJsonPath('data.score', '4.00');
    }

    public function test_purchase_order_requires_active_supplier_with_minimum_score(): void
    {
        $supplierId = $this->createSupplier();

        // Score por defecto es 5.00 (máximo) hasta la primera evaluación real.
        $this->getJson("/api/v1/suppliers/{$supplierId}")->assertJsonPath('data.score', '5.00');

        // Una mala evaluación baja el score por debajo del mínimo (3.00): la orden debe rechazarse.
        $this->evaluateSupplier($supplierId, rating: 1);

        $this->postJson('/api/v1/purchase-orders', [
            'order_number' => 'OC-0001',
            'supplier_id' => $supplierId,
            'items' => [
                ['item_name' => 'Sustrato', 'unit' => 'saco', 'quantity' => 10, 'unit_price' => 5],
            ],
        ])->assertStatus(409);

        $this->evaluateSupplier($supplierId, rating: 5);

        $this->postJson('/api/v1/purchase-orders', [
            'order_number' => 'OC-0001',
            'supplier_id' => $supplierId,
            'items' => [
                ['item_name' => 'Sustrato', 'unit' => 'saco', 'quantity' => 10, 'unit_price' => 5],
            ],
        ])->assertStatus(201)
            ->assertJsonPath('data.total', '50.00')
            ->assertJsonPath('data.status', 'issued');
    }

    public function test_purchase_order_receive_updates_status_and_only_once(): void
    {
        $supplierId = $this->createSupplier();
        $this->evaluateSupplier($supplierId);

        $orderId = $this->postJson('/api/v1/purchase-orders', [
            'order_number' => 'OC-0002',
            'supplier_id' => $supplierId,
            'items' => [
                ['item_name' => 'Funda vivero', 'unit' => 'unidad', 'quantity' => 100, 'unit_price' => 0.5],
            ],
        ])->json('data.id');

        $receive = $this->postJson("/api/v1/purchase-orders/{$orderId}/receive", [
            'quality_status' => 'approved',
        ]);
        $receive->assertStatus(200)
            ->assertJsonPath('data.order.status', 'received');

        $this->postJson("/api/v1/purchase-orders/{$orderId}/receive", [
            'quality_status' => 'approved',
        ])->assertStatus(409);
    }

    public function test_pending_deliveries_are_classified_by_urgency(): void
    {
        $supplierId = $this->createSupplier();
        $this->evaluateSupplier($supplierId);

        $this->postJson('/api/v1/purchase-orders', [
            'order_number' => 'OC-URGENTE',
            'supplier_id' => $supplierId,
            'estimated_delivery_date' => now()->toDateString(),
            'items' => [['item_name' => 'Fertilizante', 'unit' => 'kg', 'quantity' => 5, 'unit_price' => 2]],
        ])->assertStatus(201);

        $this->postJson('/api/v1/purchase-orders', [
            'order_number' => 'OC-LEJANA',
            'supplier_id' => $supplierId,
            'estimated_delivery_date' => now()->addDays(10)->toDateString(),
            'items' => [['item_name' => 'Micorriza', 'unit' => 'kg', 'quantity' => 2, 'unit_price' => 8]],
        ])->assertStatus(201);

        $pending = $this->getJson('/api/v1/purchase-orders/pending-deliveries')->assertStatus(200);
        $items = collect($pending->json('data'));

        $this->assertSame('red', $items->firstWhere('order_number', 'OC-URGENTE')['urgency']);
        $this->assertSame('green', $items->firstWhere('order_number', 'OC-LEJANA')['urgency']);
    }

    public function test_purchase_request_review_can_approve_into_an_order_or_reject(): void
    {
        $supplierId = $this->createSupplier();
        $this->evaluateSupplier($supplierId);

        $approvedRequestId = $this->postJson('/api/v1/purchase-requests', [
            'reason' => 'Stock bajo de sustrato',
            'items' => [['item_name' => 'Sustrato', 'unit' => 'saco', 'quantity' => 20]],
        ])->assertStatus(201)->json('data.id');

        $review = $this->postJson("/api/v1/purchase-requests/{$approvedRequestId}/review", [
            'decision' => 'approved',
            'order_number' => 'OC-DESDE-SOLICITUD',
            'supplier_id' => $supplierId,
        ]);
        $review->assertStatus(200)
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.purchase_order.order_number', 'OC-DESDE-SOLICITUD');

        // Ya revisada: no se puede volver a revisar.
        $this->postJson("/api/v1/purchase-requests/{$approvedRequestId}/review", [
            'decision' => 'rejected',
        ])->assertStatus(409);

        $rejectedRequestId = $this->postJson('/api/v1/purchase-requests', [
            'reason' => 'Duplicado',
            'items' => [['item_name' => 'Sustrato', 'unit' => 'saco', 'quantity' => 5]],
        ])->json('data.id');

        $this->postJson("/api/v1/purchase-requests/{$rejectedRequestId}/review", [
            'decision' => 'rejected',
        ])->assertStatus(200)->assertJsonPath('data.status', 'rejected');
    }
}
