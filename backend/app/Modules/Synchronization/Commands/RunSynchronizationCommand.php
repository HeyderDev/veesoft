<?php

namespace App\Modules\Synchronization\Commands;

use App\Modules\Synchronization\Jobs\PushSyncQueueJob;
use App\Modules\Synchronization\Repositories\Contracts\SyncQueueRepositoryInterface;
use Illuminate\Console\Command;

class RunSynchronizationCommand extends Command
{
    protected $signature = 'sync:run
        {--limit=100 : Número máximo de pendientes}
        {--now : Procesar inmediatamente sin esperar al worker}';

    protected $description = 'Encola o procesa inmediatamente los cambios de sincronización pendientes';

    public function handle(SyncQueueRepositoryInterface $queue): int
    {
        $limit = max(1, (int) $this->option('limit'));
        $entries = $queue->duePending($limit);

        foreach ($entries as $entry) {
            if ($this->option('now')) {
                PushSyncQueueJob::dispatchSync($entry->id);
            } else {
                PushSyncQueueJob::dispatch($entry->id);
            }
        }

        $mode = $this->option('now') ? 'procesados' : 'encolados';
        $this->info("Pendientes {$mode}: {$entries->count()}.");

        return self::SUCCESS;
    }
}
