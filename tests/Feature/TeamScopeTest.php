<?php

use App\Models\AuditLog;
use App\Models\Team;
use App\Models\User;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

test('global scope prevents user from seeing data of another team', function () {
    // Create two teams
    $teamA = Team::create(['name' => 'Team A', 'is_personal' => false]);
    $teamB = Team::create(['name' => 'Team B', 'is_personal' => false]);

    // Create two users
    $userA = User::create([
        'name' => 'User A',
        'email' => 'usera@test.com',
        'password' => bcrypt('password'),
        'current_team_id' => $teamA->id,
    ]);

    $userB = User::create([
        'name' => 'User B',
        'email' => 'userb@test.com',
        'password' => bcrypt('password'),
        'current_team_id' => $teamB->id,
    ]);

    // Create memberships
    $teamA->memberships()->create([
        'user_id' => $userA->id,
        'role' => 'owner',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $teamB->memberships()->create([
        'user_id' => $userB->id,
        'role' => 'owner',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    // Insert audit logs directly via DB to bypass global scope
    DB::table('audit_logs')->insert([
        ['team_id' => $teamA->id, 'user_id' => null, 'action' => 'action.a1', 'created_at' => now()],
        ['team_id' => $teamA->id, 'user_id' => null, 'action' => 'action.a2', 'created_at' => now()],
        ['team_id' => $teamB->id, 'user_id' => null, 'action' => 'action.b1', 'created_at' => now()],
    ]);

    // Act as User A — should only see Team A resources
    $this->actingAs($userA);

    $results = AuditLog::all();

    expect($results)->toHaveCount(2);
    expect($results->pluck('action')->toArray())->toContain('action.a1', 'action.a2');
    expect($results->pluck('action')->toArray())->not->toContain('action.b1');

    // Act as User B — should only see Team B resources
    $this->actingAs($userB);

    $results = AuditLog::all();

    expect($results)->toHaveCount(1);
    expect($results->first()->action)->toBe('action.b1');
});

test('has team trait auto-fills team_id on create', function () {
    $team = Team::create(['name' => 'Test Team', 'is_personal' => false]);
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@test.com',
        'password' => bcrypt('password'),
        'current_team_id' => $team->id,
    ]);

    $this->actingAs($user);

    $log = AuditLog::create(['action' => 'test.auto-filled']);

    expect($log->team_id)->toBe($team->id);
});
