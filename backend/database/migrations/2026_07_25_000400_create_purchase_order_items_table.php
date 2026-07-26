<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            // item_sku/item_name/unit son una copia autocontenida del insumo referenciado,
            // no una FK a `insumos`: ese catálogo vive en el módulo Inventory, que todavía
            // no existe en este repositorio. Cuando Inventory quede implementado, esto se
            // normaliza a foreignId('item_id')->constrained('items') (ver docs/03_MODULE_CONTRACTS/Logistics.md).
            $table->string('item_sku', 50)->nullable();
            $table->string('item_name', 150);
            $table->string('unit', 20);
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
    }
};
