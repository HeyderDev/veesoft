<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operational_tasks', function (Blueprint $table) {
            $table->foreignId('production_goal_id')->nullable()->after('vivero_id')
                ->constrained('production_goals')->nullOnDelete();
        });

        // Backfill best-effort: las tareas ya existentes de un vivero con una
        // meta abierta (finished_at nulo) quedan vinculadas a esa meta, para
        // que los contadores de Actividades no arranquen huérfanos.
        $openGoals = DB::table('production_goals')->whereNull('finished_at')->get(['id', 'vivero_id']);

        foreach ($openGoals as $goal) {
            DB::table('operational_tasks')
                ->where('vivero_id', $goal->vivero_id)
                ->whereNull('production_goal_id')
                ->update(['production_goal_id' => $goal->id]);
        }
    }

    public function down(): void
    {
        Schema::table('operational_tasks', function (Blueprint $table) {
            $table->dropForeign(['production_goal_id']);
            $table->dropColumn('production_goal_id');
        });
    }
};
