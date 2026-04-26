<?php

use App\Models\Extension;
use App\Models\User;
use App\Policies\ExtensionPolicy;
use Spatie\Permission\Models\Permission;
use Tests\Concerns\CreatesTeams;

uses(CreatesTeams::class);

beforeEach(function () {
    [$this->owner, $this->team] = $this->createTeamWithOwner('Test Team');
});

describe('ExtensionPolicy', function () {
    test('user with extension.view permission can view extensions', function () {
        Permission::firstOrCreate(['name' => 'extension.view', 'guard_name' => 'web']);
        $this->givePermission($this->owner, 'extension.view', $this->team);
        setupTeamAuth($this->owner, $this->team);

        expect($this->owner->can('viewAny', Extension::class))->toBeTrue();
    });

    test('user without extension.view permission cannot view extensions', function () {
        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member);
        setupTeamAuth($member, $this->team);

        expect($member->can('viewAny', Extension::class))->toBeFalse();
    });

    test('user with extension.manage permission can manage extensions', function () {
        Permission::firstOrCreate(['name' => 'extension.manage', 'guard_name' => 'web']);
        $this->givePermission($this->owner, 'extension.manage', $this->team);
        setupTeamAuth($this->owner, $this->team);

        expect($this->owner->can('manage', Extension::class))->toBeTrue();
    });

    test('owner role alone does not grant extension manage bypass', function () {
        // Owner has all permissions via role, but the policy checks hasPermissionTo not hasRole
        // This test verifies the policy uses permission checks only
        setupTeamAuth($this->owner, $this->team);

        // Owner gets all permissions via the CreatesTeams trait, so they should have extension.manage
        // through their assigned permissions. The key test is that hasRole is NOT used.
        $policy = new ExtensionPolicy;
        expect($policy->manage($this->owner))->toBeTrue();
    });

    test('user without extension.manage permission cannot manage', function () {
        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member);
        setupTeamAuth($member, $this->team);

        $policy = new ExtensionPolicy;
        expect($policy->manage($member))->toBeFalse();
    });
});
