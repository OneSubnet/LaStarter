<?php

namespace App\Actions\Invitations;

use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AcceptTeamInvitation
{
    public function handle(User $user, TeamInvitation $invitation): void
    {
        DB::transaction(function () use ($user, $invitation) {
            $team = $invitation->team;

            $team->memberships()->firstOrCreate(
                ['user_id' => $user->id],
                ['role' => $invitation->role, 'status' => 'active', 'joined_at' => now()],
            );

            $invitation->update(['accepted_at' => now()]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
            $role = Role::where('name', $invitation->role)
                ->where('team_id', $team->id)
                ->first();

            if ($role) {
                $user->assignRole($role);
            }

            $user->switchTeam($team);
        });
    }
}
