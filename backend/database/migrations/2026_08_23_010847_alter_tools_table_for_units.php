<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Migrate existing data from tools to tool_units
        $tools = DB::table('tools')->get();
        
        foreach ($tools as $tool) {
            $quantity = $tool->quantity > 0 ? $tool->quantity : 1;
            
            for ($i = 0; $i < $quantity; $i++) {
                // If it's the first unit, we can try to reuse the old code. Otherwise generate a new one.
                $code = ($i === 0 && !empty($tool->code)) ? $tool->code : strtoupper('HERR-' . Str::random(6));
                
                // Ensure code uniqueness
                while (DB::table('tool_units')->where('code', $code)->exists()) {
                    $code = strtoupper('HERR-' . Str::random(6));
                }

                DB::table('tool_units')->insert([
                    'tool_id' => $tool->id,
                    'code' => $code,
                    'status' => $tool->status,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 2. Alter tools table
        Schema::table('tools', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn(['code', 'status', 'quantity']);
        });
    }

    public function down(): void
    {
        Schema::table('tools', function (Blueprint $table) {
            $table->string('code')->nullable()->unique();
            $table->string('status')->default('available');
            $table->integer('quantity')->default(1);
        });

        // Try to reverse migration (keep one unit per tool)
        $units = DB::table('tool_units')->orderBy('id')->get()->groupBy('tool_id');
        
        foreach ($units as $toolId => $toolUnits) {
            $firstUnit = $toolUnits->first();
            DB::table('tools')
                ->where('id', $toolId)
                ->update([
                    'code' => $firstUnit->code,
                    'status' => $firstUnit->status,
                    'quantity' => $toolUnits->count()
                ]);
        }
    }
};
