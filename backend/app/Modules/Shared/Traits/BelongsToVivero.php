<?php

namespace App\Modules\Shared\Traits;

use App\Modules\Shared\Support\CurrentVivero;
use Illuminate\Database\Eloquent\Builder;

/**
 * Alcance automático por vivero: cualquier consulta al modelo queda filtrada
 * por el vivero activo de la request (CurrentVivero), y cualquier fila nueva
 * hereda ese vivero si no se especifica uno explícitamente.
 */
trait BelongsToVivero
{
    public static function bootBelongsToVivero(): void
    {
        static::addGlobalScope('vivero', function (Builder $builder) {
            $current = app(CurrentVivero::class);

            if ($current->hasVivero()) {
                $builder->where($builder->getModel()->getTable().'.vivero_id', $current->id());
            }
        });

        static::creating(function ($model) {
            if (! $model->vivero_id) {
                $current = app(CurrentVivero::class);

                if ($current->hasVivero()) {
                    $model->vivero_id = $current->id();
                }
            }
        });
    }
}
