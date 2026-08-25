<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->foreignId('supplier_id')->nullable()->change();
        });

        $supplierIds = DB::table('suppliers')->where('name', 'Consumidor final')->pluck('id');
        if ($supplierIds->isEmpty()) {
            return;
        }

        DB::table('purchase_orders')->whereIn('supplier_id', $supplierIds)->update(['supplier_id' => null]);
        DB::table('supplier_supply')->whereIn('supplier_id', $supplierIds)->delete();
        DB::table('supplier_tool')->whereIn('supplier_id', $supplierIds)->delete();
        DB::table('suppliers')->whereIn('id', $supplierIds)->delete();
    }

    public function down(): void
    {
        // Las compras sin proveedor son información válida; no se les reasigna un proveedor ficticio al revertir.
    }
};
