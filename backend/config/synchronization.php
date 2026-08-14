<?php

use App\Modules\Inventory\Services\MovementSyncAdapter;
use App\Modules\Planning\Services\LotCycleSyncAdapter;
use App\Modules\Planning\Services\LotSyncAdapter;
use App\Modules\Tasks\Services\OperationalTaskSyncAdapter;
use App\Modules\Tracking\Services\DispatchSyncAdapter;
use App\Modules\Tracking\Services\TrackingClientSyncAdapter;
use App\Modules\Tracking\Services\TrackingMovementSyncAdapter;

return [
    'local_node' => [
        'id' => env('SYNC_NODE_ID', '00000000-0000-4000-8000-000000000001'),
        'code' => env('SYNC_NODE_CODE', 'administrator-local'),
        'name' => env('SYNC_NODE_NAME', 'Nodo Administrador Local'),
        'type' => env('SYNC_NODE_TYPE', 'administrator'),
    ],

    'default_target' => [
        'id' => env('SYNC_TARGET_NODE_ID', '00000000-0000-4000-8000-000000000002'),
        'code' => env('SYNC_TARGET_NODE_CODE', 'central-local'),
        'name' => env('SYNC_TARGET_NODE_NAME', 'Nodo Central Local'),
        'type' => env('SYNC_TARGET_NODE_TYPE', 'central'),
        'url' => env('SYNC_TARGET_URL', 'http://127.0.0.1:8001'),
        'token' => env('SYNC_TARGET_TOKEN'),
    ],

    'transport' => [
        'timeout_seconds' => (int) env('SYNC_TIMEOUT_SECONDS', 10),
        'max_attempts' => (int) env('SYNC_MAX_ATTEMPTS', 5),
        'backoff_seconds' => [10, 30, 60, 300, 900],
    ],

    /*
    |--------------------------------------------------------------------------
    | Adaptadores de entidades
    |--------------------------------------------------------------------------
    |
    | Cada módulo funcional registra aquí, durante el Paso 3, una clase que
    | implementa SyncEntityAdapter. Synchronization nunca consulta Repositories
    | de otro módulo ni conoce sus columnas.
    |
    */
    'entity_adapters' => [
        LotSyncAdapter::class,
        LotCycleSyncAdapter::class,
        OperationalTaskSyncAdapter::class,
        MovementSyncAdapter::class,
        TrackingClientSyncAdapter::class,
        TrackingMovementSyncAdapter::class,
        DispatchSyncAdapter::class,
    ],
];
