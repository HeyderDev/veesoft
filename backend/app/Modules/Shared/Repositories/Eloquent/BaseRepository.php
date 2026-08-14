<?php

namespace App\Modules\Shared\Repositories\Eloquent;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

abstract class BaseRepository implements BaseRepositoryInterface
{
    protected Model $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    public function all()
    {
        return $this->model->all();
    }

    public function find($id)
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update($id, array $data)
    {
        $record = $this->find($id);
        $record->update($data);

        return $record;
    }

    public function delete($id)
    {
        return $this->find($id)->delete();
    }

    public function upsertForSync($id, array $data)
    {
        $record = $this->queryIncludingTrashed()->find($id);

        if (! $record) {
            $record = $this->model->newInstance();
            $record->setAttribute($record->getKeyName(), $id);
        }

        $record->fill($data);
        $record->save();

        if (method_exists($record, 'trashed') && $record->trashed()) {
            $record->restore();
        }

        return $record->refresh();
    }

    public function deleteForSync($id): bool
    {
        $record = $this->queryIncludingTrashed()->find($id);

        if (! $record || (method_exists($record, 'trashed') && $record->trashed())) {
            return true;
        }

        return (bool) $record->delete();
    }

    private function queryIncludingTrashed()
    {
        $query = $this->model->newQuery();

        if (in_array(SoftDeletes::class, class_uses_recursive($this->model), true)) {
            $query->withTrashed();
        }

        return $query;
    }
}
