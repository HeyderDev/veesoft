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
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['email', 'phone']);
            $table->foreignId('career_id')->nullable()->constrained('careers')->nullOnDelete()->after('cedula');
            $table->integer('semester')->nullable()->after('career_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['career_id']);
            $table->dropColumn(['career_id', 'semester']);
            $table->string('email', 150)->nullable();
            $table->string('phone', 30)->nullable();
        });
    }
};
