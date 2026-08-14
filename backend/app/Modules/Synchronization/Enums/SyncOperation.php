<?php

namespace App\Modules\Synchronization\Enums;

enum SyncOperation: string
{
    case CREATED = 'created';
    case UPDATED = 'updated';
    case DELETED = 'deleted';
}
