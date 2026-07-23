<?php

namespace App\Modules\Shared\Controllers;

use Illuminate\Support\Facades\DB;

class HealthController extends BaseApiController
{
    public function check()
    {
        try {
            DB::connection()->getPdo();
            $dbStatus = 'connected';
        } catch (\Exception $e) {
            $dbStatus = 'error: '.$e->getMessage();
        }

        return $this->successResponse([
            'api' => 'ERP Vivero de Cacao',
            'version' => 'v1',
            'database' => $dbStatus,
            'time' => now()->toIso8601String(),
        ], 'Sistema operativo');
    }
}
