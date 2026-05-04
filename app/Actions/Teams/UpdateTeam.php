<?php

namespace App\Actions\Teams;

use App\Models\Team;
use App\Services\Contracts\TeamServiceInterface;

/**
 * Update Team Action
 *
 * Simple orchestrator that delegates to the TeamService.
 */
class UpdateTeam
{
    public function __construct(
        protected TeamServiceInterface $teamService
    ) {}

    public function handle(Team $team, string $name): Team
    {
        return $this->teamService->updateTeam($team, $name);
    }
}
