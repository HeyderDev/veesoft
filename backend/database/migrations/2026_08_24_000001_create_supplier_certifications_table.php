<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->unique()->constrained('suppliers')->cascadeOnDelete();
            $table->boolean('has_certificate')->default(false);
            $table->string('certificate_number', 100)->nullable();
            $table->string('certifying_entity', 150)->nullable();
            $table->date('issued_at')->nullable();
            $table->date('expires_at')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamp('registered_at')->useCurrent();
            $table->timestamps();
        });

        DB::table('suppliers')->orderBy('id')->each(function (object $supplier) {
            DB::table('supplier_certifications')->insert([
                'supplier_id' => $supplier->id,
                'has_certificate' => $supplier->organic_certified,
                'expires_at' => $supplier->certificate_expires_at,
                'registered_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_certifications');
    }
};
