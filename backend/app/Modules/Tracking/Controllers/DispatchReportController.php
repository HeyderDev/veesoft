<?php

namespace App\Modules\Tracking\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Tracking\Services\DispatchReportService;
use Illuminate\Http\Request;

class DispatchReportController extends BaseApiController
{
    public function __construct(private DispatchReportService $service) {}

    /**
     * GET /tracking/dispatch-summary?production_goal_id=X
     * Única fuente que el Resumen Operativo consulta para "plántulas despachadas".
     */
    public function show(Request $request)
    {
        $data = $request->validate([
            'production_goal_id' => 'required|integer|exists:production_goals,id',
        ]);

        $goalId = (int) $data['production_goal_id'];

        return $this->successResponse([
            'production_goal_id' => $goalId,
            'dispatched_seedlings' => $this->service->totalDispatchedForGoal($goalId),
        ]);
    }

    /**
     * GET /tracking/pending-dispatches?vivero_id=X
     * Ciclos cerrados (lote ya liberado) a la espera de que se reporte cuánto se
     * despachó realmente.
     */
    public function pending(Request $request)
    {
        $data = $request->validate([
            'vivero_id' => 'required|integer|exists:viveros,id',
        ]);

        return $this->successResponse($this->service->pendingCyclesForVivero((int) $data['vivero_id']));
    }

    /**
     * POST /tracking/dispatch-reports
     * Registra la cantidad real despachada para un ciclo ya cerrado — es lo único
     * que crea el registro de despacho y puede completar la meta.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'lot_cycle_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
            'dispatched_at' => 'nullable|date',
        ]);

        $dispatch = $this->service->createReport(
            (int) $data['lot_cycle_id'],
            (int) $data['quantity'],
            $data['dispatched_at'] ?? null,
        );

        return $this->createdResponse($dispatch, 'Despacho reportado');
    }
}
