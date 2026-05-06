<?php

use App\Core\Extensions\DependencyResolver;
use App\Core\Extensions\Events\ExtensionDisabled;
use App\Core\Extensions\Events\ExtensionEnabled;
use App\Core\Extensions\Events\ExtensionInstalled;
use App\Core\Extensions\Events\ExtensionUninstalled;
use App\Core\Extensions\ExtensionManifest;
use App\Models\Extension;
use App\Models\TeamExtension;
use Illuminate\Support\Facades\Event;
use Tests\Concerns\CreatesTeams;

uses(CreatesTeams::class);

function createExtensionRecord(string $identifier, ?string $state = 'disabled', array $dependencies = []): Extension
{
    return Extension::create([
        'identifier' => $identifier,
        'name' => ucfirst(str_replace('-', ' ', $identifier)),
        'type' => 'module',
        'version' => '1.0.0',
        'state' => $state,
        'dependencies' => $dependencies,
        'path' => '/tmp/extensions/modules/'.$identifier,
    ]);
}

describe('ExtensionManager lifecycle', function () {
    test('enable dispatches ExtensionEnabled event', function () {
        [$user, $team] = $this->createTeamWithOwner('Test Team');
        $extension = createExtensionRecord('test-module', 'disabled');

        $manifest = ExtensionManifest::fromArray('/tmp/test-module', [
            'identifier' => 'test-module',
            'name' => 'Test Module',
            'type' => 'module',
            'permissions' => ['test.view'],
        ]);

        Event::fake();

        TeamExtension::updateOrCreate(
            ['extension_id' => $extension->id, 'team_id' => $team->id],
            ['is_active' => true],
        );

        Event::dispatch(new ExtensionEnabled($extension, $manifest, $team->id));

        Event::assertDispatched(ExtensionEnabled::class, fn ($e) => $e->extension->identifier === 'test-module' && $e->teamId === $team->id);
    });

    test('disable dispatches ExtensionDisabled event', function () {
        [$user, $team] = $this->createTeamWithOwner('Test Team');
        $extension = createExtensionRecord('test-module', 'disabled');

        Event::fake();

        TeamExtension::where('extension_id', $extension->id)
            ->where('team_id', $team->id)
            ->update(['is_active' => false]);

        Event::dispatch(new ExtensionDisabled($extension, $team->id));

        Event::assertDispatched(ExtensionDisabled::class);
    });

    test('install dispatches ExtensionInstalled event', function () {
        $extension = createExtensionRecord('test-module');

        $manifest = ExtensionManifest::fromArray('/tmp/test-module', [
            'identifier' => 'test-module',
            'name' => 'Test Module',
            'type' => 'module',
        ]);

        Event::fake();

        Event::dispatch(new ExtensionInstalled($extension, $manifest));

        Event::assertDispatched(ExtensionInstalled::class);
    });

    test('uninstall dispatches ExtensionUninstalled event', function () {
        Event::fake();

        Event::dispatch(new ExtensionUninstalled('test-module'));

        Event::assertDispatched(ExtensionUninstalled::class, fn ($e) => $e->identifier === 'test-module');
    });

    test('disable updates team extension to inactive', function () {
        [$user, $team] = $this->createTeamWithOwner('Test Team');
        $extension = createExtensionRecord('test-module', 'disabled');

        TeamExtension::create([
            'extension_id' => $extension->id,
            'team_id' => $team->id,
            'is_active' => true,
        ]);

        TeamExtension::where('extension_id', $extension->id)
            ->where('team_id', $team->id)
            ->update(['is_active' => false]);

        expect(
            TeamExtension::where('extension_id', $extension->id)
                ->where('team_id', $team->id)
                ->where('is_active', false)
                ->exists(),
        )->toBeTrue();
    });

    test('uninstall removes extension from database', function () {
        $extension = createExtensionRecord('test-module', 'disabled');

        $extension->delete();

        expect(Extension::where('identifier', 'test-module')->exists())->toBeFalse();
    });

    test('uninstall removes team extension pivots', function () {
        [$user, $team] = $this->createTeamWithOwner('Test Team');
        $extension = createExtensionRecord('test-module', 'disabled');

        TeamExtension::create([
            'extension_id' => $extension->id,
            'team_id' => $team->id,
            'is_active' => true,
        ]);

        TeamExtension::where('extension_id', $extension->id)->delete();
        $extension->delete();

        expect(Extension::where('identifier', 'test-module')->exists())->toBeFalse();
        expect(TeamExtension::where('extension_id', $extension->id)->exists())->toBeFalse();
    });

    test('isEnabled returns true when extension is active for team', function () {
        [$user, $team] = $this->createTeamWithOwner('Test Team');
        $extension = createExtensionRecord('test-module', 'disabled');

        TeamExtension::create([
            'extension_id' => $extension->id,
            'team_id' => $team->id,
            'is_active' => true,
        ]);

        $active = TeamExtension::query()
            ->where('is_active', true)
            ->where('team_id', $team->id)
            ->whereHas('extension', fn ($q) => $q->where('identifier', 'test-module'))
            ->exists();

        expect($active)->toBeTrue();
    });

    test('isEnabled returns false when extension is not active for team', function () {
        [$user, $team] = $this->createTeamWithOwner('Test Team');
        createExtensionRecord('test-module', 'disabled');

        $active = TeamExtension::query()
            ->where('is_active', true)
            ->where('team_id', $team->id)
            ->whereHas('extension', fn ($q) => $q->where('identifier', 'test-module'))
            ->exists();

        expect($active)->toBeFalse();
    });
});

describe('ExtensionManifest', function () {
    test('fromArray parses required fields', function () {
        $manifest = ExtensionManifest::fromArray('/tmp/test-mod', [
            'identifier' => 'test-mod',
            'name' => 'Test Module',
            'type' => 'module',
        ]);

        expect($manifest->identifier)->toBe('test-mod');
        expect($manifest->name)->toBe('Test Module');
        expect($manifest->type)->toBe('module');
        expect($manifest->dependencies)->toBe([]);
        expect($manifest->permissions)->toBe([]);
    });

    test('fromArray parses all fields', function () {
        $manifest = ExtensionManifest::fromArray('/tmp/test-mod', [
            'identifier' => 'test-mod',
            'name' => 'Test Module',
            'type' => 'module',
            'version' => '2.0.0',
            'description' => 'A test module',
            'author' => 'Test Author',
            'permissions' => ['test.view', 'test.create'],
            'dependencies' => ['base-module'],
            'minimum_core_version' => '1.0.0',
            'provides' => ['test-api'],
            'widgets' => [['identifier' => 'test-widget']],
            'metrics' => [['key' => 'test-metric']],
        ]);

        expect($manifest->version)->toBe('2.0.0');
        expect($manifest->description)->toBe('A test module');
        expect($manifest->author)->toBe('Test Author');
        expect($manifest->permissions)->toBe(['test.view', 'test.create']);
        expect($manifest->dependencies)->toBe(['base-module']);
        expect($manifest->minimumCoreVersion)->toBe('1.0.0');
        expect($manifest->provides)->toBe(['test-api']);
    });

    test('fromArray rejects invalid identifier', function () {
        ExtensionManifest::fromArray('/tmp/test', [
            'identifier' => 'INVALID',
            'type' => 'module',
        ]);
    })->throws(InvalidArgumentException::class);

    test('fromArray rejects invalid type', function () {
        ExtensionManifest::fromArray('/tmp/test', [
            'identifier' => 'test-mod',
            'type' => 'invalid',
        ]);
    })->throws(InvalidArgumentException::class);
});

describe('DependencyResolver DB queries', function () {
    test('dependents returns extensions that depend on the given one', function () {
        createExtensionRecord('module-base', 'disabled');
        createExtensionRecord('module-a', 'disabled', ['module-base']);
        createExtensionRecord('module-b', 'disabled', ['module-base']);
        createExtensionRecord('module-c', 'disabled');

        $resolver = new DependencyResolver;
        $deps = $resolver->dependents('module-base');

        expect($deps)->toContain('module-a');
        expect($deps)->toContain('module-b');
        expect($deps)->not->toContain('module-c');
    });

    test('dependents returns empty for standalone extension', function () {
        createExtensionRecord('standalone', 'disabled');

        $resolver = new DependencyResolver;
        expect($resolver->dependents('standalone'))->toBe([]);
    });

    test('canDisable returns false when dependents exist', function () {
        createExtensionRecord('module-base', 'disabled');
        createExtensionRecord('module-a', 'disabled', ['module-base']);

        $resolver = new DependencyResolver;
        expect($resolver->canDisable('module-base', 1))->toBeFalse();
    });

    test('canDisable returns true when no dependents', function () {
        createExtensionRecord('standalone', 'disabled');

        $resolver = new DependencyResolver;
        expect($resolver->canDisable('standalone', 1))->toBeTrue();
    });
});
