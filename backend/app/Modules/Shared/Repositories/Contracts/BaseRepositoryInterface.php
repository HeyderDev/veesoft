<?php

namespace App\Modules\Shared\Repositories\Contracts;

interface BaseRepositoryInterface
{
    public function all();

    public function find($id);

    public function create(array $data);

    public function update($id, array $data);

    public function delete($id);

    /**
     * Inserta o actualiza conservando la clave global recibida de otro nodo.
     */
    public function upsertForSync($id, array $data);

    /**
     * Elimina de forma idempotente durante una recepción sincronizada.
     */
    public function deleteForSync($id): bool;
}
