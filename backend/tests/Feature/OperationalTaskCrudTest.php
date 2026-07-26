<?php

namespace Tests\Feature;

use App\Modules\Tasks\Models\OperationalTask;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OperationalTaskCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_operational_task_full_crud_cycle(): void
    {
        // 1. Create a task
        $create = $this->postJson('/api/v1/tasks', [
            'title' => 'Test Task',
            'description' => 'Test Description',
            'planned_date' => now()->addDays(2)->format('Y-m-d H:i:s'),
        ]);

        $create->assertStatus(201)->assertJsonPath('data.title', 'Test Task');
        $taskId = $create->json('data.id');

        // 2. List tasks
        $this->getJson('/api/v1/tasks')->assertStatus(200);

        // 3. Show task
        $this->getJson("/api/v1/tasks/{$taskId}")
            ->assertStatus(200)
            ->assertJsonPath('data.description', 'Test Description');

        // 4. Update task
        $this->putJson("/api/v1/tasks/{$taskId}", [
            'title' => 'Updated Task Title'
        ])
            ->assertStatus(200)
            ->assertJsonPath('data.title', 'Updated Task Title');

        $completedByUser = \App\Modules\Shared\Models\User::factory()->create();
        $this->postJson("/api/v1/tasks/{$taskId}/complete", [
            'completed_by' => $completedByUser->id,
        ])
            ->assertStatus(200);
            
        $this->getJson("/api/v1/tasks/{$taskId}")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.completed_date', fn ($value) => $value !== null);

        // 6. Delete task
        $this->deleteJson("/api/v1/tasks/{$taskId}")->assertStatus(204);
        $this->getJson("/api/v1/tasks/{$taskId}")->assertStatus(404);
    }

    public function test_operational_task_rejects_past_planned_date(): void
    {
        $this->postJson('/api/v1/tasks', [
            'title' => 'Past Task',
            'planned_date' => now()->subDays(2)->format('Y-m-d H:i:s'),
        ])->assertStatus(422);
    }
}
