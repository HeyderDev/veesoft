<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('viveros')->orderBy('id')->each(function (object $vivero) {
            // Identificador técnico único: evita pedir RUC/CI al operador para
            // compras menores; no representa un proveedor fiscal real.
            $taxId = '999999999'.str_pad((string) $vivero->id, 4, '0', STR_PAD_LEFT);

            DB::table('suppliers')->insertOrIgnore([
                'vivero_id' => $vivero->id,
                'name' => 'Consumidor final',
                'tax_id' => $taxId,
                'organic_certified' => false,
                'score' => 5,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        DB::table('suppliers')->where('name', 'Consumidor final')->delete();
    }
};
