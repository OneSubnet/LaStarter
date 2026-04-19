<?php

namespace Tests\Concerns;

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait CreatesTeams
{
    protected function createTeamWithOwner(string $name = 'Test Team'): array
    {
        $user = User::factory()->create();
        $team = $this->createTeamForUser($user, $name);

        return [$user, $team];
    }

    protected function createTeamForUser(User $user, string $name = 'Test Team'): Team
    {
        $team = Team::create([
            'name' => $name,
            'user_id' => $user->id,
        ]);

        $team->memberships()->create([
            'user_id' => $user->id,
            'role' => TeamRole::Owner->value,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $ownerRole = Role::firstOrCreate(
            ['name' => TeamRole::Owner->value, 'team_id' => $team->id, 'guard_name' => 'web'],
        );
        $ownerRole->syncPermissions(Permission::pluck('name')->toArray());
        $user->assignRole($ownerRole);

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        $user->switchTeam($team);

        return $team;
    }

    protected function addMemberToTeam(Team $team, User $user, TeamRole $role = TeamRole::Member): void
    {
        $team->memberships()->create([
            'user_id' => $user->id,
            'role' => $role->value,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
        $spatieRole = Role::firstOrCreate(
            ['name' => $role->value, 'team_id' => $team->id, 'guard_name' => 'web'],
        );
        $user->assignRole($spatieRole);
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
    }

    protected function givePermission(User $user, string $permission, Team $team): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $perm = Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        $user->givePermissionTo($perm);

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
    }
}
