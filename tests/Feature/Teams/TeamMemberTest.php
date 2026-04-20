<?php

use App\Enums\TeamRole;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Tests\Concerns\CreatesTeams;

uses(CreatesTeams::class);

test('team member roles can be updated by owners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $member = User::factory()->create();
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    Role::create(['name' => TeamRole::Admin->value, 'team_id' => $team->id, 'guard_name' => 'web']);

    $response = $this
        ->actingAs($owner)
        ->patch(route('settings.team.members.update', ['current_team' => $team->slug, 'user' => $member->id]), [
            'role' => TeamRole::Admin->value,
        ]);

    $response->assertRedirect();

    expect($team->members()->where('user_id', $member->id)->first()->pivot->role->value)->toEqual(TeamRole::Admin->value);
});

test('team member roles cannot be updated by non owners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $admin = User::factory()->create();
    $member = User::factory()->create();
    $this->addMemberToTeam($team, $admin, TeamRole::Admin);
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $response = $this
        ->actingAs($admin)
        ->patch(route('settings.team.members.update', ['current_team' => $team->slug, 'user' => $member->id]), [
            'role' => TeamRole::Admin->value,
        ]);

    $response->assertForbidden();
});

test('team members can be removed by owners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $member = User::factory()->create();
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $response = $this
        ->actingAs($owner)
        ->delete(route('settings.team.members.destroy', ['current_team' => $team->slug, 'user' => $member->id]));

    $response->assertRedirect();

    expect($member->fresh()->belongsToTeam($team))->toBeFalse();
});

test('team members cannot be removed by non owners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $admin = User::factory()->create();
    $member = User::factory()->create();
    $this->addMemberToTeam($team, $admin, TeamRole::Admin);
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $response = $this
        ->actingAs($admin)
        ->delete(route('settings.team.members.destroy', ['current_team' => $team->slug, 'user' => $member->id]));

    $response->assertForbidden();
});

test('team owner cannot be removed', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');

    $response = $this
        ->actingAs($owner)
        ->delete(route('settings.team.members.destroy', ['current_team' => $team->slug, 'user' => $owner->id]));

    $response->assertForbidden();

    expect($owner->fresh()->belongsToTeam($team))->toBeTrue();
});

test('team member role cannot be set to owner', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $member = User::factory()->create();
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $response = $this
        ->actingAs($owner)
        ->patch(route('settings.team.members.update', ['current_team' => $team->slug, 'user' => $member->id]), [
            'role' => TeamRole::Owner->value,
        ]);

    $response->assertSessionHasErrors('role');

    expect($team->members()->where('user_id', $member->id)->first()->pivot->role->value)->toEqual(TeamRole::Member->value);
});

test('removed member current team is set to personal team', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $member = User::factory()->create();
    $personalTeam = $member->personalTeam();
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $member->update(['current_team_id' => $team->id]);

    $this
        ->actingAs($owner)
        ->delete(route('settings.team.members.destroy', ['current_team' => $team->slug, 'user' => $member->id]));

    expect($member->fresh()->current_team_id)->toEqual($personalTeam->id);
});
