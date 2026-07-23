<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La fase de Despacho no tiene fecha de fin planificada — termina cuando se
     * registra el despacho del lote (ver LotCycleService::terminateDispatch()), no
     * según una duración fija. Su planned_end_date queda null hasta entonces.
     */
    public function up(): void
    {
        Schema::table('lot_cycle_phases', function (Blueprint $table) {
            $table->date('planned_end_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('lot_cycle_phases', function (Blueprint $table) {
            $table->date('planned_end_date')->nullable(false)->change();
        });
    }
};
