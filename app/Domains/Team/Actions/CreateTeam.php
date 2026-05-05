<?php

namespace App\Domains\Team\Actions;

use App\Domains\Team\Events\TeamCreatedEvent;
use App\Enums\MembershipStatus;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use App\Repositories\TeamRepository;
use App\Services\Contracts\TeamServiceInterface;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Create Team Action
 *
 * Handles team creation with owner membership, permissions setup,
 * and automatic team switching for the user.
 */
class CreateTeam
{
    public function __construct(
        protected TeamServiceInterface $teamService,
        protected TeamRepository $teamRepository,
    ) {}

    public function handle(User $owner, string $name, bool $isPersonal = false): Team
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

            // Dispatch event
            Event::dispatch(new TeamCreatedEvent($team, $owner->id));

            return $team;
        });
    }

    protected function generateSlug(string $name): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while ($this->teamRepository->slugExists($slug)) {
            $slug = $originalSlug.'-'.$counter++;
        }

        return $slug;
    }

    protected function setupTeamPermissions(Team $team, User $owner): void
    {
        $permissionRegistrar = app(PermissionRegistrar::class);

        // Set the team context for permissions
        $permissionRegistrar->setPermissionsTeamId($team->id);

        // Create owner role with all permissions
        $ownerRole = Role::firstOrCreate(
            ['name' => TeamRole::Owner->value, 'team_id' => $team->id, 'guard_name' => 'web']
        );

        $ownerRole->syncPermissions(Permission::pluck('name')->toArray());

        // Assign owner role to user
        $owner->assignRole($ownerRole);

        // Reset to user's current team context
        $permissionRegistrar->setPermissionsTeamId($owner->current_team_id);
    }
}
