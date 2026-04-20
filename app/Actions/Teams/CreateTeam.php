<?php

namespace App\Actions\Teams;

use App\Enums\MembershipStatus;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class CreateTeam
{
    public function handle(User $user, string $name, bool $isPersonal = false): Team
    {
        return DB::transaction(function () use ($user, $name, $isPersonal) {
            $team = Team::create([
                'name' => $name,
                'is_personal' => $isPersonal,
            ]);

            $team->memberships()->create([
                'user_id' => $user->id,
                'role' => TeamRole::Owner->value,
                'status' => MembershipStatus::Active->value,
                'joined_at' => now(),
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

            $ownerRole = Role::firstOrCreate(
                ['name' => TeamRole::Owner->value, 'team_id' => $team->id, 'guard_name' => 'web'],
            );

            $ownerRole->syncPermissions(Permission::pluck('name')->toArray());

            $user->assignRole($ownerRole);

            app(PermissionRegistrar::class)->setPermissionsTeamId($user->current_team_id);

            $user->switchTeam($team);

            return $team;
        });
    }
}
