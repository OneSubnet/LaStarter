<?php

use App\Concerns\TeamScope;
use App\Core\Audit\AuditLogger;
use App\Models\AuditLog;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\CreatesTeams;

use function Pest\Laravel\actingAs;

uses(CreatesTeams::class);

describe('AuditLogger', function () {
    test('log creates an audit entry', function () {
        [$user, $team] = $this->createTeamWithOwner('Audit Team');

        actingAs($user);
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $logger = app(AuditLogger::class);
        $logger->log('test.action', $team, ['key' => 'value']);

        $log = AuditLog::first();
        expect($log)->not->toBeNull();
        expect($log->action)->toBe('test.action');
        expect($log->team_id)->toBe($team->id);
        expect($log->user_id)->toBe($user->id);
        expect($log->properties)->toBe(['key' => 'value']);
        expect($log->subject_type)->toBe(get_class($team));
        expect($log->subject_id)->toBe($team->id);
    });

    test('log entries are scoped by team', function () {
        [$user1, $team1] = $this->createTeamWithOwner('Team 1');
        [$user2, $team2] = $this->createTeamWithOwner('Team 2');

        actingAs($user1);
        app(PermissionRegistrar::class)->setPermissionsTeamId($team1->id);
        app(AuditLogger::class)->log('team1.action');

        actingAs($user2);
        app(PermissionRegistrar::class)->setPermissionsTeamId($team2->id);
        app(AuditLogger::class)->log('team2.action');

        // Query without global scope to verify both entries
        $allLogs = AuditLog::withoutGlobalScope(TeamScope::class)->get();
        expect($allLogs->where('team_id', $team1->id)->count())->toBe(1);
        expect($allLogs->where('team_id', $team2->id)->count())->toBe(1);
    });

    test('log generates trace id when not provided', function () {
        [$user, $team] = $this->createTeamWithOwner('Trace Team');

        actingAs($user);
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        app(AuditLogger::class)->log('traced.action');

        $log = AuditLog::first();
        expect($log->trace_id)->not->toBeNull();
        expect(strlen($log->trace_id))->toBe(36);
    });
});
