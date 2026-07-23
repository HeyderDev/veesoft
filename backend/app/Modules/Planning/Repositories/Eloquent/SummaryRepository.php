<?php

namespace App\Modules\Planning\Repositories\Eloquent;

use App\Modules\Planning\Models\Dispatch;
use App\Modules\Planning\Models\LotCyclePhase;
use App\Modules\Planning\Repositories\Contracts\SummaryRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SummaryRepository implements SummaryRepositoryInterface
{
    public function projectionVsRealityForVivero(int $viveroId, int $year): Collection
    {
        $since = Carbon::create($year, 1, 1)->startOfYear();
        $until = $since->copy()->endOfYear();

        // Se agrupa por mes en PHP (no con funciones de fecha SQL) para que la
        // consulta funcione igual sobre MySQL (producción) y SQLite (tests).
        $projected = LotCyclePhase::query()
            ->join('production_phases', 'production_phases.id', '=', 'lot_cycle_phases.phase_id')
            ->join('lot_cycles', 'lot_cycles.id', '=', 'lot_cycle_phases.lot_cycle_id')
            ->join('lots', 'lots.id', '=', 'lot_cycles.lot_id')
            ->where('lots.vivero_id', $viveroId)
            ->where('production_phases.code', 'DESP')
            ->whereBetween('lot_cycle_phases.planned_start_date', [$since->toDateString(), $until->toDateString()])
            ->select('lot_cycle_phases.planned_start_date as date', 'lots.total_capacity as quantity')
            ->get()
            ->groupBy(fn ($row) => Carbon::parse($row->date)->format('Y-m'))
            ->map(fn ($rows) => (int) $rows->sum('quantity'));

        $actual = Dispatch::query()
            ->join('lots', 'lots.id', '=', 'dispatches.lot_id')
            ->where('lots.vivero_id', $viveroId)
            ->whereBetween('dispatches.dispatched_at', [$since->toDateString(), $until->toDateString()])
            ->select('dispatches.dispatched_at as date', 'dispatches.quantity as quantity')
            ->get()
            ->groupBy(fn ($row) => Carbon::parse($row->date)->format('Y-m'))
            ->map(fn ($rows) => (int) $rows->sum('quantity'));

        return collect(range(0, 11))->map(function (int $offset) use ($since, $projected, $actual) {
            $month = $since->copy()->addMonths($offset)->format('Y-m');

            return [
                'month' => $month,
                'projected' => (int) ($projected[$month] ?? 0),
                'actual' => (int) ($actual[$month] ?? 0),
            ];
        });
    }
}
