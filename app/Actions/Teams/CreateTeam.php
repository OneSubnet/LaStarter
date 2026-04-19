<?php

namespace App\Actions\Teams;

use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class CreateTeam
{
    /**
     * Create a new team and add the user with the 'owner' role via Spatie.
     */
    public function handle(User $user, string $name, bool $isPersonal = false): Team
    {
        return DB::transaction(function () use ($user, $name, $isPersonal) {
            $team = Team::create([
                'name' => $name,
                'is_personal' => $isPersonal,
            ]);

            $team->memberships()->create([
                'user_id' => $user->id,
                'role' => 'owner',
                'status' => 'active',
                'joined_at' => now(),
            ]);

            // Set Spatie team context and assign owner role
            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

            // Create or find the 'owner' role for this team
            $ownerRole = Role::firstOrCreate(
                ['name' => 'owner', 'team_id' => $team->id, 'guard_name' => 'web'],
            );

            // Give owner all current permissions
            $ownerRole->syncPermissions(
                Permission::pluck('name')->toArray()
            );

            $user->assignRole($ownerRole);

            // Reset Spatie context
            app(PermissionRegistrar::class)->setPermissionsTeamId($user->current_team_id);

            $user->switchTeam($team);

            return $team;
        });
    }
}
