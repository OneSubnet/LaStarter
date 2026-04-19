<?php

use App\Enums\TeamRole;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\CreatesTeams;

use function Pest\Laravel\actingAs;

uses(CreatesTeams::class);

beforeEach(function () {
    [$this->owner, $this->team] = $this->createTeamWithOwner('Test Team');

    app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);
    $this->ownerRole = Role::where('team_id', $this->team->id)
        ->where('name', TeamRole::Owner->value)
        ->first();
});

describe('RolePolicy', function () {
    test('owner cannot be updated via policy', function () {
        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('update', $this->ownerRole))->toBeFalse();
    });

    test('owner cannot be deleted via policy', function () {
        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('delete', $this->ownerRole))->toBeFalse();
    });

    test('custom role can be updated with permission', function () {
        $customRole = Role::create([
            'name' => 'editor',
            'team_id' => $this->team->id,
            'guard_name' => 'web',
        ]);

        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member, TeamRole::Member);
        $this->givePermission($member, 'role.update', $this->team);

        actingAs($member);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($member->can('update', $customRole))->toBeTrue();
    });

    test('custom role cannot be updated without permission', function () {
        $customRole = Role::create([
            'name' => 'editor',
            'team_id' => $this->team->id,
            'guard_name' => 'web',
        ]);

        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member, TeamRole::Member);

        actingAs($member);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($member->can('update', $customRole))->toBeFalse();
    });

    test('belongsToTeam returns true for team role', function () {
        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('belongsToTeam', $this->ownerRole))->toBeTrue();
    });

    test('belongsToTeam returns false for other team role', function () {
        $otherOwner = User::factory()->create();
        [$otherUser, $otherTeam] = $this->createTeamWithOwner('Other Team');

        $otherOwnerRole = Role::where('team_id', $otherTeam->id)
            ->where('name', TeamRole::Owner->value)
            ->first();

        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('belongsToTeam', $otherOwnerRole))->toBeFalse();
    });
});
