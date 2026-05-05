<?php

namespace App\Domains\Team\Actions;

use App\Domains\Team\Events\TeamDeletedEvent;
use App\Models\Team;
use App\Models\User;
use App\Repositories\TeamRepository;
use App\Services\Contracts\TeamServiceInterface;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

/**
 * Delete Team Action
 *
 * Handles team deletion with proper cleanup:
 * - Switches all members' current team to their personal team
 * - Deletes memberships, invitations, extensions, settings
 * - Deletes roles and permissions
 * - Switches deleting user to another available team
 */
class DeleteTeam
{
    public function __construct(
        protected TeamServiceInterface $teamService,
        protected TeamRepository $teamRepository,
    ) {}

    public function handle(User $user, Team $team): void
    {
        $this->teamRepository->transaction(function () use ($user, $team) {
            // Switch all members who have this as their current team to their personal team
            $members = $team->members()->where('current_team_id', $team->id)->get();

            foreach ($members as $member) {
                $personalTeam = $member->teams()->where('is_personal', true)->first();
                if ($personalTeam) {
                    $member->switchTeam($personalTeam);
                }
            }

            // Delete all team data
            $team->memberships()->delete();
            $team->invitations()->delete();
            $team->teamExtensions()->delete();
            $team->extensionSettings()->delete();

            // Delete roles and permissions for this team
            Role::where('team_id', $team->id)->delete();

            // Dispatch event before deletion
            Event::dispatch(new TeamDeletedEvent($team, $user->id));

            // Delete the team
            $this->teamRepository->delete($team);

            // Switch deleting user to another team if available
            $remainingTeams = $this->teamService->getUserTeams($user)->filter(fn ($t) => $t->id !== $team->id);

            if ($remainingTeams->isNotEmpty()) {
                $user->switchTeam($remainingTeams->first());
            }
        });
    }
}
