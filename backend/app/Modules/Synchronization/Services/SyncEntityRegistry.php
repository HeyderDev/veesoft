<?php

namespace App\Modules\Synchronization\Services;

use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

class SyncEntityRegistry
{
    /** @var array<string, SyncEntityAdapter> */
    private array $adapters = [];

    public function __construct(private readonly Container $container)
    {
        foreach (config('synchronization.entity_adapters', []) as $adapterClass) {
            $this->register($this->container->make($adapterClass));
        }
    }

    public function register(SyncEntityAdapter $adapter): void
    {
        $this->adapters[$adapter->entityType()] = $adapter;
    }

    public function resolve(string $entityType): SyncEntityAdapter
    {
        if (! isset($this->adapters[$entityType])) {
            throw new InvalidArgumentException(
                "No existe un adaptador de sincronización registrado para [{$entityType}]."
            );
        }

        return $this->adapters[$entityType];
    }
}
