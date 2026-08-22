<?php

namespace App\Modules\Tracking\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface TrackingMovementRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Historial paginado, más reciente primero, opcionalmente filtrado por lote.
     */
    public function paginateWithFilters(?int $lotId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Total de plántulas despachadas en todos los lotes (suma de `quantity`).
     */
    public function totalQuantity(): int;

    /**
     * Clientes con más plántulas recibidas, para el reporte general.
     *
     * @return Collection<int, object{tracking_client_id: int, name: string, total_quantity: int}>
     */
    public function topClients(int $limit = 5): Collection;
}
