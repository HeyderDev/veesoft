<?php

namespace App\Modules\Logistics\Repositories\Eloquent;

use App\Modules\Logistics\Models\PurchaseRequest;
use App\Modules\Logistics\Repositories\Contracts\PurchaseRequestRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PurchaseRequestRepository extends BaseRepository implements PurchaseRequestRepositoryInterface
{
    public function __construct(PurchaseRequest $model)
    {
        parent::__construct($model);
    }

    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->with(['requester', 'items'])
            ->orderByDesc('created_at')->paginate($perPage);
    }

    public function paginateForRequester(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('requested_by', $userId)
            ->with(['requester', 'items'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function findWithRelations(int $id)
    {
        return $this->model->with(['requester', 'reviewer', 'items', 'purchaseOrder'])->findOrFail($id);
    }
}
