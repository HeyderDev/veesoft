<?php

namespace App\Modules\Synchronization\Enums;

enum SyncStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case SYNCED = 'synced';
    case CONFLICT = 'conflict';
    case FAILED = 'failed';
    case SUPERSEDED = 'superseded';
}
