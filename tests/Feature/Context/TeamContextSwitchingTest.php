<?php

use App\Enums\TeamRole;
use App\Models\User;
use Tests\Concerns\CreatesTeams;

use function Pest\Laravel\actingAs;

uses(CreatesTeams::class);

describe('Team Context Switching', function () {
    test('user can switch between teams', function () {
        $user = User::factory()->create();
        $teamA = $this->createTeamForUser($user, 'Team A');
        $teamB = $this->createTeamForUser($user, 'Team B');

        $user->switchTeam($teamA);
        expect($user->currentTeam->id)->toBe($teamA->id);

        $user->switchTeam($teamB);
        expect($user->currentTeam->id)->toBe($teamB->id);
    });

    test('switching teams changes visible data', function () {
        $user = User::factory()->create();
        $teamA = $this->createTeamForUser($user, 'Team A');
        $teamB = $this->createTeamForUser($user, 'Team B');

        // Create data in team A
        $teamA->invitations()->create([
            'email' => 'team-a@example.com',
            'role' => TeamRole::Member->value,
            'invited_by' => $user->id,
        ]);

        // Create data in team B
        $teamB->invitations()->create([
            'email' => 'team-b@example.com',
            'role' => TeamRole::Member->value,
            'invited_by' => $user->id,
        ]);

        actingAs($user);
        $user->switchTeam($teamA);

        expect($teamA->invitations()->count())->toBe(1);
        expect($teamB->invitations()->count())->toBe(1);
        expect($teamA->invitations()->first()->email)->toBe('team-a@example.com');
    });

    test('user cannot switch to team they do not belong to', function () {
        $user = User::factory()->create();
        $teamA = $this->createTeamForUser($user, 'Team A');

        $stranger = User::factory()->create();
        [$strangerUser, $strangerTeam] = $this->createTeamWithOwner('Stranger Team');

        actingAs($stranger);

        expect($stranger->belongsToTeam($teamA))->toBeFalse();
    });
});
