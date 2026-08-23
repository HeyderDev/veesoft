<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('movements', function (Blueprint $table) {
            $table->foreignId('tool_unit_id')->nullable()->constrained('tool_units')->nullOnDelete()->after('tool_id');
            $table->foreignId('operational_task_id')->nullable()->constrained('operational_tasks')->nullOnDelete()->after('user_id');
            $table->text('observations')->nullable()->after('details');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movements', function (Blueprint $table) {
            $table->dropForeign(['tool_unit_id']);
            $table->dropForeign(['operational_task_id']);
            $table->dropColumn(['tool_unit_id', 'operational_task_id', 'observations']);
        });
    }
};
