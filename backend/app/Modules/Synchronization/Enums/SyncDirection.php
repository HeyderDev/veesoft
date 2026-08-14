<?php

namespace App\Modules\Synchronization\Enums;

enum SyncDirection: string
{
    case OUTBOUND = 'outbound';
    case INBOUND = 'inbound';
}
