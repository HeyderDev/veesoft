<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('viveros', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('location', 150);
            $table->string('responsible', 150);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('viveros');
    }
};
