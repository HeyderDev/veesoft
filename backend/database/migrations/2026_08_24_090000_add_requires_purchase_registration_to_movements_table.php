<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movements', function (Blueprint $table) {
            // Los movimientos anteriores se conservan como saldo histórico; solo las
            // entradas manuales nuevas se marcan explícitamente como pendientes.
            $table->boolean('requires_purchase_registration')
                ->default(false)
                ->after('purchase_order_item_id');
        });
    }

    public function down(): void
    {
        Schema::table('movements', function (Blueprint $table) {
            $table->dropColumn('requires_purchase_registration');
        });
    }
};
