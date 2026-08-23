<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reemplaza a la migración original que escopaba tools.code por vivero: el
 * PR de Inventario (develop) movió el código individual de tools.code a
 * tool_units.code (una fila por unidad física), así que el aislamiento por
 * vivero se aplica ahí en vez de en tools.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tool_units', function (Blueprint $table) {
            $table->foreignId('vivero_id')->nullable()->after('id')->constrained('viveros')->cascadeOnDelete();
        });

        // Hereda el vivero de la herramienta (tipo) a la que pertenece cada unidad.
        if (DB::getDriverName() === 'sqlite') {
            DB::statement(
                'UPDATE tool_units SET vivero_id = (SELECT vivero_id FROM tools WHERE tools.id = tool_units.tool_id)'
            );
        } else {
            DB::statement(
                'UPDATE tool_units tu INNER JOIN tools t ON t.id = tu.tool_id SET tu.vivero_id = t.vivero_id'
            );
        }

        Schema::table('tool_units', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->unique(['vivero_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::table('tool_units', function (Blueprint $table) {
            $table->dropUnique(['vivero_id', 'code']);
            $table->unique(['code']);
            $table->dropConstrainedForeignId('vivero_id');
        });
    }
};
