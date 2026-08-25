<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Reconciliación exclusiva de MySQL (bases antiguas podían crear la tabla con
        // MyISAM, que ignora claves foráneas); la tabla ya nace con sus FK en
        // 2026_08_23_100000_create_supplier_supply_table.php para cualquier driver,
        // así que en sqlite (tests) no hay nada que reconciliar aquí.
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE supplies ENGINE=InnoDB');
        DB::statement('ALTER TABLE supplier_supply ENGINE=InnoDB');

        foreach (['supplier_id' => 'suppliers', 'supply_id' => 'supplies'] as $column => $referencedTable) {
            $exists = DB::table('information_schema.KEY_COLUMN_USAGE')
                ->where('TABLE_SCHEMA', DB::getDatabaseName())
                ->where('TABLE_NAME', 'supplier_supply')
                ->where('COLUMN_NAME', $column)
                ->where('REFERENCED_TABLE_NAME', $referencedTable)
                ->exists();

            if (! $exists) {
                Schema::table('supplier_supply', function (Blueprint $table) use ($column, $referencedTable) {
                    $table->foreign($column)->references('id')->on($referencedTable)->cascadeOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        // Se preservan las claves para no dejar una relación incompleta al revertir.
    }
};
