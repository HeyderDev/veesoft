<?php

namespace App\Modules\Synchronization\Enums;

enum SyncConflictStatus: string
{
    case OPEN = 'open';
    case RESOLVED = 'resolved';
}
