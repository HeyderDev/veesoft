<?php

namespace App\Modules\Planning\Repositories\Eloquent;

use App\Modules\Planning\Models\LotCycle;
use App\Modules\Planning\Models\LotCyclePhase;
use App\Modules\Planning\Models\LotCycleReschedule;
use App\Modules\Planning\Repositories\Contracts\LotCycleRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LotCycleRepository extends BaseRepository implements LotCycleRepositoryInterface
{
    public function __construct(LotCycle $model)
    {
        parent::__construct($model);
    }

    public function findActiveForLot(int $lotId)
    {
        return $this->model->where('lot_id', $lotId)->where('status', LotCycle::STATUS_IN_PROGRESS)->first();
    }

    public function findWithPhases(int $id)
    {
        return $this->model->with(['phases' => fn ($q) => $q->orderBy('planned_start_date'), 'phases.phase', 'lot'])
            ->findOrFail($id);
    }

    public function allActiveWithPhasesForVivero(int $viveroId): Collection
    {
        return $this->model->where('status', LotCycle::STATUS_IN_PROGRESS)
            ->whereHas('lot', fn ($q) => $q->where('vivero_id', $viveroId))
            ->with(['phases' => fn ($q) => $q->orderBy('planned_start_date'), 'phases.phase'])
            ->get();
    }

    public function exportForSync($id): array
    {
        $cycle = $this->model
            ->newQuery()
            ->with(['phases', 'reschedules'])
            ->findOrFail($id);

        return [
            'lot_id' => $cycle->lot_id,
            'production_goal_id' => $cycle->production_goal_id,
            'started_at' => $cycle->getRawOriginal('started_at'),
            'status' => $cycle->status,
            'phases' => $cycle->phases->map(fn (LotCyclePhase $phase) => [
                'id' => (string) $phase->getKey(),
                'phase_id' => $phase->phase_id,
                'planned_start_date' => $phase->getRawOriginal('planned_start_date'),
                'planned_end_date' => $phase->getRawOriginal('planned_end_date'),
            ])->values()->all(),
            'reschedules' => $cycle->reschedules->map(fn (LotCycleReschedule $reschedule) => [
                'id' => (string) $reschedule->getKey(),
                'from_phase_id' => $reschedule->from_phase_id,
                'to_phase_id' => $reschedule->to_phase_id,
                'previous_transition_date' => $reschedule->getRawOriginal('previous_transition_date'),
                'new_transition_date' => $reschedule->getRawOriginal('new_transition_date'),
                'rescheduled_by' => $reschedule->rescheduled_by,
            ])->values()->all(),
        ];
    }

    public function applySynchronizedState($id, array $payload)
    {
        return DB::transaction(function () use ($id, $payload) {
            $cycle = $this->upsertForSync($id, [
                'lot_id' => $payload['lot_id'],
                'production_goal_id' => $payload['production_goal_id'],
                'started_at' => $payload['started_at'],
                'status' => $payload['status'],
            ]);

            foreach ($payload['phases'] ?? [] as $phase) {
                $this->upsertChild(
                    new LotCyclePhase,
                    $phase['id'],
                    [
                        'lot_cycle_id' => $cycle->getKey(),
                        'phase_id' => $phase['phase_id'],
                        'planned_start_date' => $phase['planned_start_date'],
                        'planned_end_date' => $phase['planned_end_date'],
                    ],
                );
            }

            foreach ($payload['reschedules'] ?? [] as $reschedule) {
                $this->upsertChild(
                    new LotCycleReschedule,
                    $reschedule['id'],
                    [
                        'lot_cycle_id' => $cycle->getKey(),
                        'from_phase_id' => $reschedule['from_phase_id'],
                        'to_phase_id' => $reschedule['to_phase_id'],
                        'previous_transition_date' => $reschedule['previous_transition_date'],
                        'new_transition_date' => $reschedule['new_transition_date'],
                        'rescheduled_by' => $reschedule['rescheduled_by'],
                    ],
                );
            }

            return $cycle->refresh();
        });
    }

    private function upsertChild($model, $id, array $data): void
    {
        $record = $model->newQuery()->find($id) ?? $model->newInstance();
        $record->setAttribute($record->getKeyName(), $id);
        $record->fill($data);
        $record->save();
    }
}
