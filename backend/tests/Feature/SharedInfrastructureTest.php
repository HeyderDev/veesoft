<?php

namespace Tests\Feature;

use App\Modules\Shared\Enums\PermissionCode;
use App\Modules\Shared\Models\AuditLog;
use App\Modules\Shared\Models\Permission;
use App\Modules\Shared\Models\Role;
use App\Modules\Shared\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SharedInfrastructureTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_read_session_and_logout_with_spa_cookies(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'role_id' => $role->id,
        ]);

        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/login', [
                'email' => 'admin@example.com',
                'password' => 'password',
            ])
            ->assertOk()
            ->assertJsonPath('data.email', 'admin@example.com')
            ->assertJsonPath('data.role.name', 'Admin');

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->postJson('/api/v1/logout')->assertOk();
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_login_rejects_invalid_credentials_and_inactive_users(): void
    {
        User::factory()->create([
            'email' => 'inactive@example.com',
            'status' => 'inactive',
        ]);

        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/login', [
                'email' => 'inactive@example.com',
                'password' => 'incorrect',
            ])
            ->assertUnprocessable();

        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/login', [
                'email' => 'inactive@example.com',
                'password' => 'password',
            ])
            ->assertForbidden();
    }

    public function test_guests_cannot_access_session_or_planning_routes(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
        $this->getJson('/api/v1/viveros')->assertUnauthorized();
    }

    public function test_policy_uses_permissions_assigned_to_the_users_role(): void
    {
        $role = Role::factory()->create(['name' => 'Operario']);
        $permission = Permission::query()->create([
            'code' => PermissionCode::PLANNING_VIEW->value,
            'name' => PermissionCode::PLANNING_VIEW->label(),
        ]);
        $role->permissions()->attach($permission);
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue(Gate::forUser($user)->allows(PermissionCode::PLANNING_VIEW->value));
        $this->assertFalse(Gate::forUser($user)->allows(PermissionCode::PLANNING_DELETE->value));
    }

    public function test_planning_delete_requires_the_delete_permission(): void
    {
        $role = Role::factory()->create(['name' => 'Operario']);
        $permissions = collect([
            PermissionCode::PLANNING_VIEW,
            PermissionCode::PLANNING_CREATE,
        ])->map(fn (PermissionCode $code): Permission => Permission::query()->create([
            'code' => $code->value,
            'name' => $code->label(),
        ]));
        $role->permissions()->attach($permissions->pluck('id'));
        $user = User::factory()->create(['role_id' => $role->id]);
        Sanctum::actingAs($user);

        $viveroId = $this->postJson('/api/v1/viveros', [
            'name' => 'Vivero protegido',
            'location' => 'El Carmen',
            'responsible' => 'Responsable',
        ])->assertCreated()->json('data.id');

        $this->deleteJson("/api/v1/viveros/{$viveroId}")->assertForbidden();
    }

    public function test_auditable_trait_records_actor_and_model_changes(): void
    {
        $adminRole = Role::factory()->create(['name' => 'Admin']);
        $actor = User::factory()->create(['role_id' => $adminRole->id]);
        Sanctum::actingAs($actor);

        $role = Role::query()->create([
            'name' => 'Supervisor',
            'description' => 'Supervisa operaciones',
        ]);
        $role->update(['description' => 'Supervisa el vivero']);
        $role->delete();

        $logs = AuditLog::query()
            ->where('auditable_type', Role::class)
            ->where('auditable_id', $role->id)
            ->orderBy('id')
            ->get();

        $this->assertSame(['created', 'updated', 'deleted'], $logs->pluck('action')->all());
        $this->assertSame($actor->id, $logs->first()->user_id);
        $this->assertSame('Supervisa operaciones', $logs[1]->changes['before']['description']);
        $this->assertSame('Supervisa el vivero', $logs[1]->changes['after']['description']);
    }

    public function test_user_audit_never_exposes_password_or_remember_token(): void
    {
        $user = User::factory()->create();

        $log = AuditLog::query()
            ->where('auditable_type', User::class)
            ->where('auditable_id', $user->id)
            ->where('action', 'created')
            ->firstOrFail();

        $this->assertArrayNotHasKey('password', $log->changes['after']);
        $this->assertArrayNotHasKey('remember_token', $log->changes['after']);
    }

    public function test_user_can_be_audited_when_deleting_their_own_account(): void
    {
        $adminRole = Role::factory()->create(['name' => 'Admin']);
        $user = User::factory()->create(['role_id' => $adminRole->id]);
        Sanctum::actingAs($user);

        $user->delete();

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => null,
            'auditable_type' => User::class,
            'auditable_id' => $user->id,
            'action' => 'deleted',
        ]);
    }
}
