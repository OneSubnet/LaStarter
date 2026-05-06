<?php

use App\Actions\Teams\CreateTeam;
use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\ExtensionManifest;
use App\Core\System\CompatibilityChecker;
use App\Core\System\CompatibilityReport;
use App\Core\System\CoreVersion;
use App\Models\User;
use Spatie\Permission\Models\Permission;

describe('CoreVersion', function () {
    test('current returns version from config', function () {
        config(['lastarter.version' => '2.5.0']);
        $version = CoreVersion::current();

        expect($version->current)->toBe('2.5.0');
        expect($version->latest)->toBeNull();
        expect($version->updateAvailable)->toBeFalse();
    });

    test('isUpToDate returns true when no update available', function () {
        $version = new CoreVersion('1.0.0', null, null, false);
        expect($version->isUpToDate())->toBeTrue();
    });

    test('isUpToDate returns false when update available', function () {
        $version = new CoreVersion('1.0.0', '2.0.0', null, true);
        expect($version->isUpToDate())->toBeFalse();
    });
});

describe('CompatibilityReport', function () {
    test('ok creates passing report', function () {
        $report = CompatibilityReport::ok();

        expect($report->compatible)->toBeTrue();
        expect($report->errors)->toBe([]);
        expect($report->warnings)->toBe([]);
    });

    test('error creates failing report', function () {
        $report = CompatibilityReport::error('Something broke');

        expect($report->compatible)->toBeFalse();
        expect($report->errors)->toBe(['Something broke']);
    });

    test('warn creates passing report with warning', function () {
        $report = CompatibilityReport::warn('Heads up');

        expect($report->compatible)->toBeTrue();
        expect($report->warnings)->toBe(['Heads up']);
    });

    test('withError adds error and marks incompatible', function () {
        $report = CompatibilityReport::ok()->withError('New error');

        expect($report->compatible)->toBeFalse();
        expect($report->errors)->toBe(['New error']);
    });

    test('withWarning adds warning without breaking compatibility', function () {
        $report = CompatibilityReport::ok()->withWarning('Minor issue');

        expect($report->compatible)->toBeTrue();
        expect($report->warnings)->toBe(['Minor issue']);
    });

    test('merge combines two reports', function () {
        $a = CompatibilityReport::ok()->withWarning('warn-a');
        $b = CompatibilityReport::error('err-b');

        $merged = $a->merge($b);

        expect($merged->compatible)->toBeFalse();
        expect($merged->errors)->toBe(['err-b']);
        expect($merged->warnings)->toBe(['warn-a']);
    });
});

describe('CompatibilityChecker', function () {
    test('canUpdateExtension passes when no minimum core version', function () {
        $manifest = ExtensionManifest::fromArray('/tmp/test', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
        ]);

        $report = app(CompatibilityChecker::class)->canUpdateExtension($manifest);

        expect($report->compatible)->toBeTrue();
    });

    test('canUpdateExtension fails when core version too low', function () {
        config(['lastarter.version' => '1.0.0']);

        $manifest = ExtensionManifest::fromArray('/tmp/test', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'minimum_core_version' => '2.0.0',
        ]);

        $report = app(CompatibilityChecker::class)->canUpdateExtension($manifest);

        expect($report->compatible)->toBeFalse();
    });

    test('canUpdateExtension passes when core meets minimum', function () {
        config(['lastarter.version' => '2.5.0']);

        $manifest = ExtensionManifest::fromArray('/tmp/test', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'minimum_core_version' => '2.0.0',
        ]);

        $report = app(CompatibilityChecker::class)->canUpdateExtension($manifest);

        expect($report->compatible)->toBeTrue();
    });

    test('validateManifestEvolution passes when adding provides', function () {
        $old = ExtensionManifest::fromArray('/tmp/old', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '1.0.0',
            'provides' => ['api-a'],
        ]);

        $new = ExtensionManifest::fromArray('/tmp/new', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '1.1.0',
            'provides' => ['api-a', 'api-b'],
        ]);

        $report = app(CompatibilityChecker::class)->validateManifestEvolution($old, $new);

        expect($report->compatible)->toBeTrue();
    });

    test('validateManifestEvolution fails when removing provides', function () {
        $old = ExtensionManifest::fromArray('/tmp/old', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '1.0.0',
            'provides' => ['api-a', 'api-b'],
        ]);

        $new = ExtensionManifest::fromArray('/tmp/new', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '2.0.0',
            'provides' => ['api-a'],
        ]);

        $report = app(CompatibilityChecker::class)->validateManifestEvolution($old, $new);

        expect($report->compatible)->toBeFalse();
        expect($report->errors)->toHaveCount(1);
    });

    test('validateManifestEvolution fails when removing permissions', function () {
        $old = ExtensionManifest::fromArray('/tmp/old', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '1.0.0',
            'permissions' => ['test.view', 'test.create'],
        ]);

        $new = ExtensionManifest::fromArray('/tmp/new', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '2.0.0',
            'permissions' => ['test.view'],
        ]);

        $report = app(CompatibilityChecker::class)->validateManifestEvolution($old, $new);

        expect($report->compatible)->toBeFalse();
    });

    test('validateManifestEvolution fails when version does not increase', function () {
        $old = ExtensionManifest::fromArray('/tmp/old', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '2.0.0',
        ]);

        $new = ExtensionManifest::fromArray('/tmp/new', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '1.0.0',
        ]);

        $report = app(CompatibilityChecker::class)->validateManifestEvolution($old, $new);

        expect($report->compatible)->toBeFalse();
    });

    test('validateManifestEvolution warns on new dependencies', function () {
        $old = ExtensionManifest::fromArray('/tmp/old', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '1.0.0',
            'dependencies' => ['base-mod'],
        ]);

        $new = ExtensionManifest::fromArray('/tmp/new', [
            'identifier' => 'test-mod',
            'name' => 'Test',
            'type' => 'module',
            'version' => '1.1.0',
            'dependencies' => ['base-mod', 'extra-mod'],
        ]);

        $report = app(CompatibilityChecker::class)->validateManifestEvolution($old, $new);

        expect($report->compatible)->toBeTrue();
        expect($report->warnings)->toHaveCount(1);
    });
});

describe('System update permission', function () {
    test('system.update permission exists in database', function () {
        expect(
            Permission::where('name', 'system.update')
                ->where('guard_name', 'web')
                ->exists()
        )->toBeTrue();
    });

    test('owner role has system.update permission when team is created', function () {
        $user = User::factory()->create();
        $team = app(CreateTeam::class)->handle($user, 'Test Team');

        setPermissionsTeamId($team->id);
        expect($user->hasPermissionTo('system.update'))->toBeTrue();
    });

    test('extensions:sync grants new permissions to existing owner roles', function () {
        $user = User::factory()->create();
        $team = app(CreateTeam::class)->handle($user, 'Test Team');

        Permission::create(['name' => 'test.new-permission', 'guard_name' => 'web']);

        app(ExtensionManager::class)->sync();

        setPermissionsTeamId($team->id);
        expect($user->hasPermissionTo('test.new-permission'))->toBeTrue();
    });
});

describe('CoreVersionCommand', function () {
    test('it displays the current version', function () {
        config(['lastarter.version' => '3.2.1']);

        $this->artisan('core:version')
            ->expectsOutput('LaStarter v3.2.1')
            ->assertSuccessful();
    });
});
