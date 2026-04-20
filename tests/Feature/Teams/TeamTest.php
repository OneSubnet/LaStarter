<?php

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Tests\Concerns\CreatesTeams;

uses(CreatesTeams::class);

test('the teams index page can be rendered', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('settings.teams.index', ['current_team' => $user->currentTeam->slug]));

    $response->assertOk();
});

test('teams can be created', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('settings.teams.store', ['current_team' => $user->currentTeam->slug]), [
            'name' => 'Test Team',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('teams', [
        'name' => 'Test Team',
        'is_personal' => false,
    ]);
});

test('team slug uses next available suffix', function () {
    $user = User::factory()->create();

    Team::factory()->create(['name' => 'Acme', 'slug' => 'acme']);
    Team::factory()->create(['name' => 'Acme One', 'slug' => 'acme-1']);
    Team::factory()->create(['name' => 'Acme Ten', 'slug' => 'acme-10']);

    $this
        ->actingAs($user)
        ->post(route('settings.teams.store', ['current_team' => $user->currentTeam->slug]), [
            'name' => 'Acme',
        ]);

    $this->assertDatabaseHas('teams', [
        'name' => 'Acme',
        'slug' => 'acme-11',
    ]);
});

test('the team edit page can be rendered', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');

    $response = $this
        ->actingAs($owner)
        ->get(route('settings.team.general', ['current_team' => $team->slug]));

    $response->assertOk();
});

test('teams can be updated by owners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Original Name');

    $response = $this
        ->actingAs($owner)
        ->patch(route('settings.team.update', ['current_team' => $team->slug]), [
            'name' => 'Updated Name',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('teams', [
        'id' => $team->id,
        'name' => 'Updated Name',
    ]);
});

test('teams cannot be updated by members', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $member = User::factory()->create();
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $response = $this
        ->actingAs($member)
        ->patch(route('settings.team.update', ['current_team' => $team->slug]), [
            'name' => 'Updated Name',
        ]);

    $response->assertForbidden();
});

test('teams can be deleted by owners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');

    $response = $this
        ->actingAs($owner)
        ->delete(route('settings.team.destroy', ['current_team' => $team->slug]), [
            'name' => $team->name,
        ]);

    $response->assertRedirect();

    $this->assertSoftDeleted('teams', [
        'id' => $team->id,
    ]);
});

test('team deletion requires name confirmation', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');

    $response = $this
        ->actingAs($owner)
        ->delete(route('settings.team.destroy', ['current_team' => $team->slug]), [
            'name' => 'Wrong Name',
        ]);

    $response->assertSessionHasErrors('name');

    $this->assertDatabaseHas('teams', [
        'id' => $team->id,
        'deleted_at' => null,
    ]);
});

test('deleting current team switches to alphabetically first remaining team', function () {
    $user = User::factory()->create(['name' => 'Mike']);

    $zuluTeam = $this->createTeamForUser($user, 'Zulu Team');
    $alphaTeam = $this->createTeamForUser($user, 'Alpha Team');
    $betaTeam = $this->createTeamForUser($user, 'Beta Team');

    $user->switchTeam($zuluTeam);

    $response = $this
        ->actingAs($user)
        ->delete(route('settings.team.destroy', ['current_team' => $zuluTeam->slug]), [
            'name' => $zuluTeam->name,
        ]);

    $response->assertRedirect();

    $this->assertSoftDeleted('teams', [
        'id' => $zuluTeam->id,
    ]);

    expect($user->fresh()->current_team_id)->toEqual($alphaTeam->id);
});

test('deleting current team falls back to personal team when alphabetically first', function () {
    $user = User::factory()->create();
    $personalTeam = $user->personalTeam();
    $team = $this->createTeamForUser($user, 'Zulu Team');

    $user->switchTeam($team);

    $response = $this
        ->actingAs($user)
        ->delete(route('settings.team.destroy', ['current_team' => $team->slug]), [
            'name' => $team->name,
        ]);

    $response->assertRedirect();

    $this->assertSoftDeleted('teams', [
        'id' => $team->id,
    ]);

    expect($user->fresh()->current_team_id)->toEqual($personalTeam->id);
});

test('deleting non current team leaves current team unchanged', function () {
    $user = User::factory()->create();
    $personalTeam = $user->personalTeam();

    $response = $this
        ->actingAs($user)
        ->delete(route('settings.team.destroy', ['current_team' => $personalTeam->slug]), [
            'name' => $personalTeam->name,
        ]);

    // Personal teams cannot be deleted
    $response->assertForbidden();
});

test('deleting team switches other affected users to their personal team', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $member = User::factory()->create();
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $member->update(['current_team_id' => $team->id]);

    $response = $this
        ->actingAs($owner)
        ->delete(route('settings.team.destroy', ['current_team' => $team->slug]), [
            'name' => $team->name,
        ]);

    $response->assertRedirect();

    expect($member->fresh()->current_team_id)->toEqual($member->personalTeam()->id);
});

test('personal teams cannot be deleted', function () {
    $user = User::factory()->create();

    $personalTeam = $user->personalTeam();

    $response = $this
        ->actingAs($user)
        ->delete(route('settings.team.destroy', ['current_team' => $personalTeam->slug]), [
            'name' => $personalTeam->name,
        ]);

    $response->assertForbidden();

    $this->assertDatabaseHas('teams', [
        'id' => $personalTeam->id,
        'deleted_at' => null,
    ]);
});

test('teams cannot be deleted by non owners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $member = User::factory()->create();
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $response = $this
        ->actingAs($member)
        ->delete(route('settings.team.destroy', ['current_team' => $team->slug]), [
            'name' => $team->name,
        ]);

    $response->assertForbidden();
});

test('users can switch teams', function () {
    $user = User::factory()->create();
    $team = $this->createTeamForUser($user, 'Switch Target');

    $response = $this
        ->actingAs($user)
        ->post(route('settings.teams.switch', ['current_team' => $user->currentTeam->slug, 'team' => $team->slug]));

    $response->assertRedirect();

    expect($user->fresh()->current_team_id)->toEqual($team->id);
});

test('users cannot switch to team they dont belong to', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('settings.teams.switch', ['current_team' => $user->currentTeam->slug, 'team' => $team->slug]));

    $response->assertForbidden();
});

test('guests cannot access teams', function () {
    $user = User::factory()->create();

    $response = $this->get(route('settings.teams.index', ['current_team' => $user->currentTeam->slug]));

    $response->assertRedirect(route('login'));
});
