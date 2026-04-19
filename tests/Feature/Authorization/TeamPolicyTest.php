<?php

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\CreatesTeams;

use function Pest\Laravel\actingAs;

uses(CreatesTeams::class);

beforeEach(function () {
    [$this->owner, $this->team] = $this->createTeamWithOwner('Test Team');
});

describe('TeamPolicy', function () {
    test('owner can update team', function () {
        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('update', $this->team))->toBeTrue();
    });

    test('owner can delete non-personal team', function () {
        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('delete', $this->team))->toBeTrue();
    });

    test('personal team cannot be deleted', function () {
        $personalTeam = Team::create([
            'name' => 'Personal',
            'user_id' => $this->owner->id,
            'is_personal' => true,
        ]);
        $personalTeam->memberships()->create([
            'user_id' => $this->owner->id,
            'role' => TeamRole::Owner->value,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($personalTeam->id);

        expect($this->owner->can('delete', $personalTeam))->toBeFalse();
    });

    test('owner can add members', function () {
        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('addMember', $this->team))->toBeTrue();
    });

    test('owner can update members', function () {
        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('updateMember', $this->team))->toBeTrue();
    });

    test('owner can remove members', function () {
        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('removeMember', $this->team))->toBeTrue();
    });

    test('owner can invite members', function () {
        actingAs($this->owner);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($this->owner->can('inviteMember', $this->team))->toBeTrue();
    });

    test('member without permission cannot update team', function () {
        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member, TeamRole::Member);

        actingAs($member);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($member->can('update', $this->team))->toBeFalse();
    });

    test('member with team.update permission can update team', function () {
        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member, TeamRole::Member);
        $this->givePermission($member, 'team.update', $this->team);

        actingAs($member);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($member->can('update', $this->team))->toBeTrue();
    });

    test('non-member cannot view team', function () {
        $stranger = User::factory()->create();

        actingAs($stranger);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->team->id);

        expect($stranger->can('view', $this->team))->toBeFalse();
    });
});
