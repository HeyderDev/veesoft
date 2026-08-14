<?php

namespace App\Modules\Shared\Repositories\Eloquent;

use App\Modules\Shared\Models\AuditLog;
use App\Modules\Shared\Repositories\Contracts\AuditLogRepositoryInterface;

class AuditLogRepository extends BaseRepository implements AuditLogRepositoryInterface
{
    public function __construct(AuditLog $model)
    {
        parent::__construct($model);
    }
}
