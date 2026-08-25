<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Reconciliación exclusiva de MySQL, ver 2026_08_23_100200_ensure_supplier_supply_foreign_keys.php.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE tools ENGINE=InnoDB');
        }

        Schema::create('supplier_tool', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignId('tool_id')->constrained('tools')->cascadeOnDelete();
            $table->decimal('unit_price', 10, 2);
            $table->timestamps();
            $table->unique(['supplier_id', 'tool_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_tool');
    }
};
