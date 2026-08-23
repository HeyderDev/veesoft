<?php

namespace App\Modules\Inventory\Repositories\Contracts;

use App\Modules\Shared\Repositories\Contracts\BaseRepositoryInterface;

interface ToolUnitRepositoryInterface extends BaseRepositoryInterface
{
    public function generateUniqueCode(): string;

    public function findByCode(string $code);
}
