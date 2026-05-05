<?php

namespace App\Domains\Team\Commands\Handlers;

use App\Domain\Commands\Command;
use App\Domain\Commands\CommandHandler;
use App\Domains\Team\Commands\CreateTeamCommand;
use App\Domains\Team\Events\TeamCreatedEvent;
use App\Enums\MembershipStatus;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use App\Repositories\TeamRepository;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Create Team Command Handler
 */
class CreateTeamHandler implements CommandHandler
{
    public function __construct(
        protected TeamRepository $repository,
    ) {}

    public function handle(Command|CreateTeamCommand $command): Team
    {
        return $this->repository->transaction(function () use ($command) {
            $slug = $this->generateSlug($command->name);

            $team = Team::create([
                'name' => $command->name,
                'slug' => $slug,
                'is_personal' => $command->isPersonal,
            ]);

            // Create owner membership
            $team->memberships()->create([
                'user_id' => $command->ownerId,
                'role' => TeamRole::Owner->value,
                'status' => MembershipStatus::Active->value,
                'joined_at' => now(),
            ]);

            // Setup permissions
            $this->setupPermissions($team, $command->ownerId);

            // Switch user to new team
            $user = User::find($command->ownerId);
            if ($user) {
                $user->switchTeam($team);
            }

            // Dispatch event
            Event::dispatch(new TeamCreatedEvent($team, $command->ownerId));

            return $team;
        });
    }

    protected function generateSlug(string $name): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while ($this->repository->slugExists($slug)) {
            $slug = $originalSlug.'-'.$counter++;
        }

        return $slug;
    }

    protected function setupPermissions(Team $team, int $ownerId): void
    {
        $permissionRegistrar = app(PermissionRegistrar::class);
        $permissionRegistrar->setPermissionsTeamId($team->id);

        $ownerRole = Role::firstOrCreate(
            ['name' => TeamRole::Owner->value, 'team_id' => $team->id, 'guard_name' => 'web']
        );

        $ownerRole->syncPermissions(Permission::pluck('name')->toArray());

        $user = User::find($ownerId);
        if ($user) {
            $user->assignRole($ownerRole);
        }

        $permissionRegistrar->setPermissionsTeamId($user?->current_team_id);
    }
}
