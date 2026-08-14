<?php

namespace Tests\Feature;

use App\Modules\Synchronization\Enums\SyncStatus;
use App\Modules\Synchronization\Services\SyncEntityRegistry;
use App\Modules\Tasks\Services\OperationalTaskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TasksSynchronizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_task_enqueues_task_and_resource_aggregate(): void
    {
        $task = $this->app->make(OperationalTaskService::class)->createTask([
            'title' => 'Riego sincronizable',
            'description' => 'Regar el lote',
            'priority' => 'high',
            'planned_date' => now()->addDay()->toDateString(),
            'resources' => [
                ['type' => 'tool', 'id' => 25],
            ],
        ]);

        $this->assertDatabaseHas('sync_queue', [
            'entity_type' => 'tasks.operational-task',
            'entity_id' => (string) $task->id,
            'status' => SyncStatus::PENDING->value,
        ]);

        $payload = $this->app->make(SyncEntityRegistry::class)
            ->resolve('tasks.operational-task')
            ->export((string) $task->id);

        $this->assertSame('Riego sincronizable', $payload['title']);
        $this->assertSame('tool', $payload['resources'][0]['resource_type']);
        $this->assertSame(25, $payload['resources'][0]['resource_id']);
    }
}
