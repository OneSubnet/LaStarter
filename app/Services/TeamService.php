<?php

namespace App\Services;

use App\Enums\MembershipStatus;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use App\Repositories\TeamRepository;
use App\Services\Contracts\TeamServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Team Service
 *
 * Handles all team-related business logic.
 * Uses repositories for data access and follows SOLID principles.
 */
class TeamService implements TeamServiceInterface
{
    /**
     * The team repository instance.
     */
    protected TeamRepository $teamRepository;

    /**
     * Create a new service instance.
     */
    public function __construct(TeamRepository $teamRepository)
    {
        $this->teamRepository = $teamRepository;
    }

    /**
     * {@inheritDoc}
     */
    public function createTeam(User $owner, string $name, bool $isPersonal = false): Team
    {
        return $this->teamRepository->transaction(function () use ($owner, $name, $isPersonal) {
            $slug = $this->generateSlug($name);

            $team = $this->teamRepository->create([
                'name' => $name,
                'slug' => $slug,
                'is_personal' => $isPersonal,
            ]);

            // Create owner membership
            $team->memberships()->create([
                'user_id' => $owner->id,
                'role' => TeamRole::Owner->value,
                'status' => MembershipStatus::Active->value,
                'joined_at' => now(),
            ]);

            // Set up permissions for the team
            $this->setupTeamPermissions($team, $owner);

            // Switch user to the new team
            $owner->switchTeam($team);

            return $team;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function updateTeam(Team $team, string $name): Team
    {
        return $this->teamRepository->transaction(function () use ($team, $name) {
            $team = $this->teamRepository->query()
                ->whereKey($team->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->teamRepository->update($team, ['name' => $name]);

            return $team;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function deleteTeam(Team $team, User $user): void
    {
        $this->teamRepository->transaction(function () use ($team, $user) {
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

            // Delete the team
            $this->teamRepository->delete($team);

            // Switch deleting user to another team if available
            $remainingTeams = $this->getUserTeams($user)->filter(fn ($t) => $t->id !== $team->id);

            if ($remainingTeams->isNotEmpty()) {
                $user->switchTeam($remainingTeams->first());
            }
        });
    }

    /**
     * {@inheritDoc}
     */
    public function switchTeam(User $user, Team $team): void
    {
        if (! $this->userBelongsToTeam($user, $team)) {
            throw new \Exception('User does not belong to this team.');
        }

        $user->switchTeam($team);
    }

    /**
     * {@inheritDoc}
     */
    public function userBelongsToTeam(User $user, Team $team): bool
    {
        return $user->belongsToTeam($team);
    }

    /**
     * {@inheritDoc}
     */
    public function getUserTeams(User $user): Collection
    {
        return $user->teams;
    }

    /**
     * {@inheritDoc}
     */
    public function isNameAvailable(string $name, ?int $excludeTeamId = null): bool
    {
        return ! $this->teamRepository->query()
            ->where('name', $name)
            ->when($excludeTeamId, fn ($q) => $q->where('id', '!=', $excludeTeamId))
            ->exists();
    }

    /**
     * {@inheritDoc}
     */
    public function generateSlug(string $name): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while ($this->teamRepository->slugExists($slug)) {
            $slug = $originalSlug.'-'.$counter++;
        }

        return $slug;
    }

    /**
     * Set up permissions for a new team.
     */
    protected function setupTeamPermissions(Team $team, User $owner): void
    {
        // Set the team context for permissions
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        // Create owner role with all permissions
        $ownerRole = Role::firstOrCreate(
            ['name' => TeamRole::Owner->value, 'team_id' => $team->id, 'guard_name' => 'web']
        );

        $ownerRole->syncPermissions(Permission::pluck('name')->toArray());

        // Assign owner role to user
        $owner->assignRole($ownerRole);

        // Reset to user's current team context
        app(PermissionRegistrar::class)->setPermissionsTeamId($owner->current_team_id);
    }

    /**
     * Get the team repository.
     */
    public function getRepository(): TeamRepository
    {
        return $this->teamRepository;
    }
}
