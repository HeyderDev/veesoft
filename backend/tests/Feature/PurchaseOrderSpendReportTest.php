<?php

namespace Tests\Feature;

use App\Modules\Logistics\Models\PurchaseOrder;
use App\Modules\Logistics\Models\Supplier;
use App\Modules\Planning\Models\Vivero;
use App\Modules\Shared\Models\Role;
use App\Modules\Shared\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseOrderSpendReportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Vivero $vivero;

    protected function setUp(): void
    {
        parent::setUp();

        $this->vivero = Vivero::create(['name' => 'Vivero Central', 'location' => 'El Carmen', 'responsible' => 'Admin Test']);
        $role = Role::create(['name' => 'Admin']);
        $this->admin = User::factory()->create(['role_id' => $role->id]);
    }

    private function actingAsAdmin()
    {
        return $this->actingAs($this->admin)->withHeader('X-Vivero-Id', (string) $this->vivero->id);
    }

    private function createSupplier(string $name = 'Agroinsumos El Carmen'): Supplier
    {
        return Supplier::create([
            'vivero_id' => $this->vivero->id,
            'name' => $name,
            'tax_id' => '0100000009-'.uniqid(),
            'status' => Supplier::STATUS_ACTIVE,
            'score' => 5.00,
        ]);
    }

    private function createOrder(Supplier $supplier, string $issuedAt, float $total): PurchaseOrder
    {
        $order = PurchaseOrder::create([
            'vivero_id' => $this->vivero->id,
            'order_number' => (string) random_int(1, 999999),
            'supplier_id' => $supplier->id,
            'status' => PurchaseOrder::STATUS_RECEIVED,
            'issued_at' => $issuedAt,
            'estimated_delivery_date' => now()->addDays(5)->toDateString(),
            'total' => $total,
        ]);

        \App\Modules\Logistics\Models\PurchaseReceipt::create([
            'purchase_order_id' => $order->id,
            'received_at' => $issuedAt,
            'quality_status' => \App\Modules\Logistics\Models\PurchaseReceipt::QUALITY_APPROVED,
        ]);

        return $order;
    }

    public function test_spend_report_totals_and_supplier_breakdown_for_a_custom_range(): void
    {
        $supplierA = $this->createSupplier('Agroinsumos El Carmen');
        $supplierB = $this->createSupplier('Vivero Insumos SA');

        $this->createOrder($supplierA, '2026-03-10', 100.00);
        $this->createOrder($supplierB, '2026-03-15', 50.00);
        // Fuera del rango pedido: no debe contarse.
        $this->createOrder($supplierA, '2026-06-01', 999.00);

        $report = $this->actingAsAdmin()->getJson(
            '/api/v1/purchase-orders/spend-report?start_date=2026-01-01&end_date=2026-03-31&label=Meta+Q1'
        );

        $report->assertStatus(200)
            ->assertJsonPath('data.label', 'Meta Q1')
            ->assertJsonPath('data.total_spent', '150.00')
            ->assertJsonPath('data.orders_count', 2);

        $suppliers = collect($report->json('data.suppliers'));
        $this->assertSame('100.00', $suppliers->firstWhere('supplier_name', 'Agroinsumos El Carmen')['total_spent']);
        $this->assertSame('50.00', $suppliers->firstWhere('supplier_name', 'Vivero Insumos SA')['total_spent']);
    }

    public function test_annual_report_covers_the_full_year_when_no_range_is_given(): void
    {
        $supplier = $this->createSupplier();
        $this->createOrder($supplier, '2026-02-01', 30.00);
        $this->createOrder($supplier, '2025-12-31', 999.00);

        $report = $this->actingAsAdmin()->getJson('/api/v1/purchase-orders/spend-report?year=2026');

        $report->assertStatus(200)
            ->assertJsonPath('data.total_spent', '30.00')
            ->assertJsonPath('data.orders_count', 1);
    }
}
