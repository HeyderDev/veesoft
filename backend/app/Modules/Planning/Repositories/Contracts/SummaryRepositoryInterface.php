<?php

namespace App\Modules\Planning\Repositories\Contracts;

use Illuminate\Support\Collection;

/**
 * No extiende BaseRepositoryInterface: no representa el CRUD de una única entidad,
 * sino consultas agregadas de solo lectura que cruzan varias tablas del módulo
 * para alimentar el Resumen (Paso 4).
 */
interface SummaryRepositoryInterface
{
    /**
     * Serie mensual (los 12 meses de `$year`) de plántulas proyectadas (fecha
     * planificada de la fase Despacho) vs. realmente despachadas, para un vivero.
     *
     * @return Collection<int, array{month: string, projected: int, actual: int}>
     */
    public function projectionVsRealityForVivero(int $viveroId, int $year): Collection;
}
