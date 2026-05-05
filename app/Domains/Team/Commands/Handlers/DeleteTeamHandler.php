<?php

namespace App\Domains\Team\Commands\Handlers;

use App\Domain\Commands\Command;
use App\Domain\Commands\CommandHandler;
use App\Domains\Team\Commands\DeleteTeamCommand;
use App\Domains\Team\Events\TeamDeletedEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

/**
 * Delete Team Command Handler
 */
class DeleteTeamHandler implements CommandHandler
{
    public function handle(Command|DeleteTeamCommand $command): void
    {
        DB::transaction(function () use ($command) {
            $team = $command->team;
            $user = User::find($command->userId);

            // Switch members to their personal team
            $team->members()->where('current_team_id', $team->id)->get()->each(function ($member) {
                $personalTeam = $member->teams()->where('is_personal', true)->first();
                if ($personalTeam) {
                    $member->switchTeam($personalTeam);
                }
            });

            // Delete team data
            $team->memberships()->delete();
            $team->invitations()->delete();
            $team->teamExtensions()->delete();
            $team->extensionSettings()->delete();
            Role::where('team_id', $team->id)->delete();

            // Dispatch event before deletion
            Event::dispatch(new TeamDeletedEvent($team, $command->userId));

            $team->delete();

            // Switch deleting user to another team
            if ($user) {
                $remainingTeams = $user->teams()->where('id', '!=', $team->id);
                if ($remainingTeams->exists()) {
                    $user->switchTeam($remainingTeams->first());
                }
            }
        });
    }
}
