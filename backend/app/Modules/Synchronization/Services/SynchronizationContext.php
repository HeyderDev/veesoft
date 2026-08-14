<?php

namespace App\Modules\Synchronization\Services;

class SynchronizationContext
{
    private int $receivingDepth = 0;

    public function isReceiving(): bool
    {
        return $this->receivingDepth > 0;
    }

    public function whileReceiving(callable $callback): mixed
    {
        $this->receivingDepth++;

        try {
            return $callback();
        } finally {
            $this->receivingDepth--;
        }
    }
}
