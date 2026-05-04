<?php

namespace App\Actions\Teams;

use App\Core\Audit\AuditLogger;
use App\Models\Team;
use App\Models\User;
use App\Services\Contracts\TeamServiceInterface;

/**
 * Delete Team Action
 *
 * Orchestrator that handles audit logging and delegates deletion to TeamService.
 */
class DeleteTeam
{
    public function __construct(
        private AuditLogger $audit,
        private TeamServiceInterface $teamService
    ) {}

    public function handle(User $user, Team $team): void
    {
        $this->audit->log('team.deleted', $team, ['name' => $team->name]);

        $this->teamService->deleteTeam($team, $user);

        // Handle user's current team after deletion
        if ($user->isCurrentTeam($team)) {
            $user->switchTeam($user->fallbackTeam($team));
        }
    }
}
