<?php

use App\Models\User;
use Tests\Concerns\CreatesTeams;

uses(CreatesTeams::class);

test('new user is redirected to onboarding after registration', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'New User',
        'email' => 'newuser@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $this->assertAuthenticated();
    $user = User::where('email', 'newuser@example.com')->first();
    $team = $user->currentTeam;

    $response->assertRedirect("/{$team->slug}/onboarding");
});

test('onboarding page is accessible for incomplete users', function () {
    $user = User::factory()->create();
    $team = $this->createTeamForUser($user, 'Test Team');

    $response = $this->actingAs($user)
        ->get(route('onboarding', ['current_team' => $team->slug]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('user.onboarding_step')
    );
});

test('completed onboarding user is redirected to dashboard', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
        'onboarding_step' => 4,
    ]);
    $team = $this->createTeamForUser($user, 'Test Team');

    $response = $this->actingAs($user)
        ->get(route('onboarding', ['current_team' => $team->slug]));

    $response->assertRedirect(route('dashboard', ['current_team' => $team->slug]));
});

test('onboarding step 0 updates user name', function () {
    $user = User::factory()->create();
    $team = $this->createTeamForUser($user, 'Test Team');

    $response = $this->actingAs($user)
        ->post(route('onboarding.update', ['current_team' => $team->slug]), [
            'step' => 0,
            'name' => 'Updated Name',
        ]);

    $response->assertRedirect();
    expect($user->fresh()->name)->toBe('Updated Name');
    expect($user->fresh()->onboarding_step)->toBe(1);
});

test('onboarding step 1 updates team name', function () {
    $user = User::factory()->create();
    $team = $this->createTeamForUser($user, 'Original Team');

    $response = $this->actingAs($user)
        ->post(route('onboarding.update', ['current_team' => $team->slug]), [
            'step' => 1,
            'team_name' => 'Renamed Team',
        ]);

    $response->assertRedirect();
    expect($team->fresh()->name)->toBe('Renamed Team');
    expect($user->fresh()->onboarding_step)->toBe(2);
});

test('onboarding completion redirects to dashboard', function () {
    $user = User::factory()->create();
    $team = $this->createTeamForUser($user, 'Test Team');

    $response = $this->actingAs($user)
        ->post(route('onboarding.update', ['current_team' => $team->slug]), [
            'step' => 3,
            'role' => 'freelance',
        ]);

    $response->assertRedirect(route('dashboard', ['current_team' => $team->slug]));
    expect((bool) $user->fresh()->onboarding_completed)->toBeTrue();
    expect($user->fresh()->onboarding_step)->toBe(4);
});
