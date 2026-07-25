<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Services\MovementService;
use App\Modules\Shared\Controllers\BaseApiController;
use Illuminate\Http\Request;

class MovementController extends BaseApiController
{
    public function __construct(
        private MovementService $movementService
    ) {}

    public function index(Request $request)
    {
        $type = $request->query('type');
        $search = $request->query('q');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');

        $movements = $this->movementService->list(15, $type, $search, $startDate, $endDate);

        return $this->paginatedResponse($movements, 'Movimientos obtenidos');
    }
}
