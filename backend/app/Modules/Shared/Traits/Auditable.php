<?php

namespace App\Modules\Shared\Traits;

use App\Modules\Shared\Models\User;
use App\Modules\Shared\Repositories\Contracts\AuditLogRepositoryInterface;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model): void {
            static::recordAudit($model, 'created', [
                'after' => static::visibleAuditValues($model, $model->getAttributes()),
            ]);
        });

        static::updated(function (Model $model): void {
            $after = static::visibleAuditValues($model, $model->getChanges());
            $before = array_intersect_key($model->getOriginal(), $after);

            if ($after !== []) {
                static::recordAudit($model, 'updated', [
                    'before' => $before,
                    'after' => $after,
                ]);
            }
        });

        static::deleted(function (Model $model): void {
            static::recordAudit($model, 'deleted', [
                'before' => static::visibleAuditValues($model, $model->getAttributes()),
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $changes
     */
    private static function recordAudit(Model $model, string $action, array $changes): void
    {
        $userId = auth()->id();

        // La fila del usuario ya no existe cuando Eloquent dispara el evento deleted.
        if ($action === 'deleted' && $model instanceof User && $model->getKey() === $userId) {
            $userId = null;
        }

        app(AuditLogRepositoryInterface::class)->create([
            'user_id' => $userId,
            'auditable_type' => $model->getMorphClass(),
            'auditable_id' => $model->getKey(),
            'action' => $action,
            'changes' => $changes,
        ]);
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private static function visibleAuditValues(Model $model, array $values): array
    {
        return array_diff_key($values, array_flip($model->getHidden()));
    }
}
