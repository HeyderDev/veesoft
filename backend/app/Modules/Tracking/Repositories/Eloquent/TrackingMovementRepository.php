<?php

namespace App\Modules\Tracking\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use App\Modules\Tracking\Models\TrackingClient;
use App\Modules\Tracking\Models\TrackingMovement;
use App\Modules\Tracking\Repositories\Contracts\TrackingMovementRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class TrackingMovementRepository extends BaseRepository implements TrackingMovementRepositoryInterface
{
    public function __construct(TrackingMovement $model)
    {
        parent::__construct($model);
    }

    public function paginateWithFilters(?int $lotId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with('trackingClient')
            ->when($lotId, fn ($q) => $q->where('lot_id', $lotId))
            ->orderByDesc('movement_date')
            ->paginate($perPage);
    }

    public function totalQuantity(): int
    {
        return (int) $this->model->sum('quantity');
    }

    public function topClients(int $limit = 5): Collection
    {
        return $this->model
            ->selectRaw('tracking_client_id, sum(quantity) as total_quantity')
            ->groupBy('tracking_client_id')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get()
            ->map(function ($row) {
                $client = TrackingClient::withTrashed()->find($row->tracking_client_id);

                return [
                    'tracking_client_id' => $row->tracking_client_id,
                    'name' => $client?->name ?? 'Cliente eliminado',
                    'total_quantity' => (int) $row->total_quantity,
                ];
            });
    }
}
