<?php

namespace App\Modules\Synchronization\Enums;

enum SyncNodeType: string
{
    case ADMINISTRATOR = 'administrator';
    case CENTRAL = 'central';
    case MOBILE = 'mobile';
}
