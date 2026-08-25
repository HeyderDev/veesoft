<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tracking_movements', function (Blueprint $table) {
            $table->foreignId('lot_cycle_id')->nullable()->after('lot_id')
                ->constrained('lot_cycles')->nullOnDelete();
        });

        // Backfill best-effort: para cada movimiento ya existente, se anida al
        // ciclo de ese lote que estaba vigente en la fecha del movimiento (el
        // más reciente iniciado antes o el mismo día) — un lote puede haber
        // tenido varios ciclos a lo largo del tiempo.
        $movements = DB::table('tracking_movements')->whereNull('lot_cycle_id')->get(['id', 'lot_id', 'movement_date']);

        foreach ($movements as $movement) {
            $cycle = DB::table('lot_cycles')
                ->where('lot_id', $movement->lot_id)
                ->where('started_at', '<=', $movement->movement_date)
                ->orderByDesc('started_at')
                ->first(['id']);

            if ($cycle) {
                DB::table('tracking_movements')->where('id', $movement->id)->update(['lot_cycle_id' => $cycle->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('tracking_movements', function (Blueprint $table) {
            $table->dropForeign(['lot_cycle_id']);
            $table->dropColumn('lot_cycle_id');
        });
    }
};
