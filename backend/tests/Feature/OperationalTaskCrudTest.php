<?php

namespace Tests\Feature;

use App\Modules\Tasks\Models\OperationalTask;
use App\Modules\Shared\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OperationalTaskCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private int $viveroId;

    protected function setUp(): void
    {
        parent::setUp();
        
        $adminRole = \App\Modules\Shared\Models\Role::firstOrCreate(
            ['name' => 'Admin'],
            ['description' => 'Administrador del sistema']
        );
        $this->user = User::factory()->create(['role_id' => $adminRole->id]);
        
        $viveroResponse = $this->actingAs($this->user)->postJson('/api/v1/viveros', [
            'name' => 'Vivero Test',
            'location' => 'Test Location',
            'responsible' => 'Test Responsible',
        ]);
        
        $this->viveroId = $viveroResponse->json('data.id');
        $this->withHeaders(['X-Vivero-Id' => $this->viveroId]);
    }

    public function test_operational_task_full_crud_cycle(): void
    {
        // 1. Create a task
        $create = $this->actingAs($this->user)->postJson('/api/v1/tasks', [
            'title' => 'Test Task',
            'description' => 'Test Description',
            'planned_date' => now()->addDays(2)->format('Y-m-d H:i:s'),
        ]);

        $create->assertStatus(201)->assertJsonPath('data.title', 'Test Task');
        $taskId = $create->json('data.id');

        // 2. List tasks
        $this->actingAs($this->user)->getJson('/api/v1/tasks')->assertStatus(200);

        // 3. Show task
        $this->actingAs($this->user)->getJson("/api/v1/tasks/{$taskId}")
            ->assertStatus(200)
            ->assertJsonPath('data.description', 'Test Description');

        // 4. Update task
        $this->actingAs($this->user)->putJson("/api/v1/tasks/{$taskId}", [
            'title' => 'Updated Task Title'
        ])
            ->assertStatus(200)
            ->assertJsonPath('data.title', 'Updated Task Title');

        $completedByUser = User::factory()->create();
        $this->actingAs($this->user)->postJson("/api/v1/tasks/{$taskId}/complete", [
            'completed_by' => $completedByUser->id,
        ])
            ->assertStatus(200);
            
        $this->actingAs($this->user)->getJson("/api/v1/tasks/{$taskId}")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.completed_date', fn ($value) => $value !== null);

        // 6. Delete task
        $this->actingAs($this->user)->deleteJson("/api/v1/tasks/{$taskId}")->assertStatus(204);
        $this->actingAs($this->user)->getJson("/api/v1/tasks/{$taskId}")->assertStatus(404);
    }

    public function test_operational_task_rejects_past_planned_date(): void
    {
        $this->actingAs($this->user)->postJson('/api/v1/tasks', [
            'title' => 'Past Task',
            'planned_date' => now()->subDays(2)->format('Y-m-d H:i:s'),
        ])->assertStatus(422);
    }
}
