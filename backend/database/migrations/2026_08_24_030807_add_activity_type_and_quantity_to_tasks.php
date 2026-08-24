<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operational_tasks', function (Blueprint $table) {
            $table->foreignId('activity_type_id')->nullable()->after('lot_cycle_phase_id')->constrained('activity_types')->nullOnDelete();
        });

        Schema::table('operational_task_resources', function (Blueprint $table) {
            $table->decimal('quantity', 10, 2)->default(1)->after('resource_id');
        });
    }

    public function down(): void
    {
        Schema::table('operational_task_resources', function (Blueprint $table) {
            $table->dropColumn('quantity');
        });

        Schema::table('operational_tasks', function (Blueprint $table) {
            $table->dropForeign(['activity_type_id']);
            $table->dropColumn('activity_type_id');
        });
    }
};
