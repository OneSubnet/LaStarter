<?php

namespace App\Actions\Teams;

use App\Models\Team;
use App\Models\User;
use App\Services\Contracts\TeamServiceInterface;

/**
 * Create Team Action
 *
 * Simple orchestrator that delegates to the TeamService.
 * Actions are thin wrappers around services for complex operations.
 */
class CreateTeam
{
    public function __construct(
        protected TeamServiceInterface $teamService
    ) {}

    public function handle(User $user, string $name, bool $isPersonal = false): Team
    {
        return $this->teamService->createTeam($user, $name, $isPersonal);
    }
}
