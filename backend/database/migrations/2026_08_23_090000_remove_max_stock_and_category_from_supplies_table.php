<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Corrección de arquitectura para el módulo de Inventario: "stock máximo" no
 * aporta valor operativo (no hay capacidad física fija que controlar) y la
 * categorización de insumos se reemplaza por elegir la unidad de medida
 * directamente de una lista fija, sin depender de una categoría intermedia.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            $table->dropColumn(['max_stock', 'category']);
        });
    }

    public function down(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            $table->decimal('max_stock', 10, 2)->nullable()->after('unit');
            $table->string('category')->nullable()->after('description');
        });
    }
};
