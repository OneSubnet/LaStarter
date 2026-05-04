<?php

namespace App\Services\Contracts;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * Team Service Interface
 *
 * Defines the contract for team-related business logic.
 */
interface TeamServiceInterface
{
    /**
     * Create a new team.
     */
    public function createTeam(User $owner, string $name, bool $isPersonal = false): Team;

    /**
     * Update a team's name.
     */
    public function updateTeam(Team $team, string $name): Team;

    /**
     * Delete a team.
     */
    public function deleteTeam(Team $team, User $user): void;

    /**
     * Switch the user's current team.
     */
    public function switchTeam(User $user, Team $team): void;

    /**
     * Check if a user belongs to a team.
     */
    public function userBelongsToTeam(User $user, Team $team): bool;

    /**
     * Get all teams for a user.
     *
     * @return Collection<int, Team>
     */
    public function getUserTeams(User $user): Collection;

    /**
     * Validate if a team name is available.
     */
    public function isNameAvailable(string $name, ?int $excludeTeamId = null): bool;

    /**
     * Generate a unique slug for a team.
     */
    public function generateSlug(string $name): string;
}
