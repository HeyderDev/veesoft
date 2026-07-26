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
        Schema::table('operational_tasks', function (Blueprint $table) {
            $table->unsignedBigInteger('completed_by')->nullable()->after('completed_date');
            $table->foreign('completed_by')->references('id')->on('users')->onDelete('set null');
            
            // Note: If you want to change 'in_progress' to 'pending', you could do it here,
            // but we'll just handle it in the application layer or with a DB statement.
        });
        
        \Illuminate\Support\Facades\DB::table('operational_tasks')
            ->where('status', 'in_progress')
            ->update(['status' => 'pending']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('operational_tasks', function (Blueprint $table) {
            $table->dropForeign(['completed_by']);
            $table->dropColumn('completed_by');
        });
    }
};
