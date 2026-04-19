<?php

use App\Enums\TeamRole;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\CreatesTeams;

uses(CreatesTeams::class);

test('team invitations can be created', function () {
    Notification::fake();

    [$owner, $team] = $this->createTeamWithOwner('Test Team');

    $response = $this
        ->actingAs($owner)
        ->post(route('settings.team.invitations.store', ['current_team' => $team->slug]), [
            'email' => 'invited@example.com',
            'role' => TeamRole::Member->value,
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('team_invitations', [
        'team_id' => $team->id,
        'email' => 'invited@example.com',
        'role' => TeamRole::Member->value,
    ]);
});

test('team invitations can be created by admins', function () {
    Notification::fake();

    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $admin = User::factory()->create();
    $this->addMemberToTeam($team, $admin, TeamRole::Admin);
    $this->givePermission($admin, 'invitation.create', $team);

    $response = $this
        ->actingAs($admin)
        ->post(route('settings.team.invitations.store', ['current_team' => $team->slug]), [
            'email' => 'invited@example.com',
            'role' => TeamRole::Member->value,
        ]);

    $response->assertRedirect();
});

test('existing team members cannot be invited', function () {
    Notification::fake();

    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $member = User::factory()->create(['email' => 'member@example.com']);
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $response = $this
        ->actingAs($owner)
        ->post(route('settings.team.invitations.store', ['current_team' => $team->slug]), [
            'email' => 'member@example.com',
            'role' => TeamRole::Member->value,
        ]);

    $response->assertSessionHasErrors('email');
});

test('duplicate invitations cannot be created', function () {
    Notification::fake();

    [$owner, $team] = $this->createTeamWithOwner('Test Team');

    TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'invited@example.com',
        'invited_by' => $owner->id,
    ]);

    $response = $this
        ->actingAs($owner)
        ->post(route('settings.team.invitations.store', ['current_team' => $team->slug]), [
            'email' => 'invited@example.com',
            'role' => TeamRole::Member->value,
        ]);

    $response->assertSessionHasErrors('email');
});

test('team invitations cannot be created by members', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $member = User::factory()->create();
    $this->addMemberToTeam($team, $member, TeamRole::Member);

    $response = $this
        ->actingAs($member)
        ->post(route('settings.team.invitations.store', ['current_team' => $team->slug]), [
            'email' => 'invited@example.com',
            'role' => TeamRole::Member->value,
        ]);

    $response->assertForbidden();
});

test('team invitations can be cancelled by owners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');

    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'invited_by' => $owner->id,
    ]);

    $response = $this
        ->actingAs($owner)
        ->delete(route('settings.team.invitations.destroy', ['current_team' => $team->slug, 'invitation' => $invitation->id]));

    $response->assertRedirect();

    $this->assertDatabaseMissing('team_invitations', [
        'id' => $invitation->id,
    ]);
});

test('team invitations can be accepted', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $invitedUser = User::factory()->create(['email' => 'invited@example.com']);

    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'invited@example.com',
        'role' => TeamRole::Member,
        'invited_by' => $owner->id,
    ]);

    $response = $this
        ->actingAs($invitedUser)
        ->get(route('invitations.accept', $invitation));

    $response->assertRedirect(route('dashboard', ['current_team' => $team->slug]));

    expect($invitedUser->fresh()->belongsToTeam($team))->toBeTrue();
    expect($invitation->fresh()->accepted_at)->not->toBeNull();
});

test('team invitations cannot be accepted by uninvited user', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $uninvitedUser = User::factory()->create(['email' => 'uninvited@example.com']);

    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'invited@example.com',
        'invited_by' => $owner->id,
    ]);

    $response = $this
        ->actingAs($uninvitedUser)
        ->get(route('invitations.accept', $invitation));

    $response->assertSessionHasErrors('invitation');

    expect($uninvitedUser->fresh()->belongsToTeam($team))->toBeFalse();
});

test('expired invitations cannot be accepted', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $invitedUser = User::factory()->create(['email' => 'invited@example.com']);

    $invitation = TeamInvitation::factory()->expired()->create([
        'team_id' => $team->id,
        'email' => 'invited@example.com',
        'invited_by' => $owner->id,
    ]);

    $response = $this
        ->actingAs($invitedUser)
        ->get(route('invitations.accept', $invitation));

    $response->assertSessionHasErrors('invitation');

    expect($invitedUser->fresh()->belongsToTeam($team))->toBeFalse();
});
