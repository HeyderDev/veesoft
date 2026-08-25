<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('viveros')->orderBy('id')->each(function (object $vivero) {
            $supplier = DB::table('suppliers')
                ->where('vivero_id', $vivero->id)
                ->where('name', 'Consumidor final')
                ->first();

            if (! $supplier) {
                $taxId = '999999999'.str_pad((string) $vivero->id, 4, '0', STR_PAD_LEFT);
                DB::table('suppliers')->insert([
                    'vivero_id' => $vivero->id,
                    'name' => 'Consumidor final',
                    'tax_id' => $taxId,
                    'organic_certified' => false,
                    'score' => 5,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $supplier = DB::table('suppliers')->where('tax_id', $taxId)->first();
            }

            if ($supplier->deleted_at !== null || $supplier->status !== 'active') {
                DB::table('suppliers')->where('id', $supplier->id)->update([
                    'deleted_at' => null,
                    'status' => 'active',
                    'updated_at' => now(),
                ]);
            }

            $now = now();
            DB::table('supplies')->where('vivero_id', $vivero->id)->orderBy('id')->each(function (object $supply) use ($supplier, $now) {
                DB::table('supplier_supply')->insertOrIgnore([
                    'supplier_id' => $supplier->id,
                    'supply_id' => $supply->id,
                    'unit_price' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });
            DB::table('tools')->where('vivero_id', $vivero->id)->orderBy('id')->each(function (object $tool) use ($supplier, $now) {
                DB::table('supplier_tool')->insertOrIgnore([
                    'supplier_id' => $supplier->id,
                    'tool_id' => $tool->id,
                    'unit_price' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });
        });
    }

    public function down(): void
    {
        $supplierIds = DB::table('suppliers')->where('name', 'Consumidor final')->pluck('id');
        DB::table('supplier_supply')->whereIn('supplier_id', $supplierIds)->delete();
        DB::table('supplier_tool')->whereIn('supplier_id', $supplierIds)->delete();
    }
};
