<?php

namespace App\Actions\Teams;

use App\Core\Audit\AuditLogger;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class DeleteTeam
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(User $user, Team $team): void
    {
        $this->audit->log('team.deleted', $team, ['name' => $team->name]);

        DB::transaction(function () use ($user, $team) {
            User::where('current_team_id', $team->id)
                ->where('id', '!=', $user->id)
                ->each(fn (User $affectedUser) => $affectedUser->switchTeam($affectedUser->personalTeam()));

            Role::where('team_id', $team->id)->delete();
            $team->invitations()->delete();
            $team->memberships()->delete();
            $team->delete();
        });

        if ($user->isCurrentTeam($team)) {
            $user->switchTeam($user->fallbackTeam($team));
        }
    }
}
