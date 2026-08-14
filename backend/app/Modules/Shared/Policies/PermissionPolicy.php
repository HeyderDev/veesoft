<?php

namespace App\Modules\Shared\Policies;

use App\Modules\Shared\Enums\PermissionCode;
use App\Modules\Shared\Models\User;

class PermissionPolicy
{
    public function allows(User $user, PermissionCode $permission): bool
    {
        return $user->hasPermission($permission);
    }
}
