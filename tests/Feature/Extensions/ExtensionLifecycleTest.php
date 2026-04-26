<?php

use App\Core\Extensions\ExtensionState;
use App\Models\Extension;
use App\Models\Team;
use App\Models\TeamExtension;
use App\Models\User;

describe('Extension Lifecycle', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->team = Team::create([
            'name' => 'Lifecycle Team',
            'slug' => 'lifecycle-team',
            'is_personal' => false,
            'is_active' => true,
        ]);
        $this->team->members()->attach($this->user, ['role' => 'owner', 'status' => 'active']);
    });

    test('extension state enum has all values', function () {
        expect(ExtensionState::NotInstalled->value)->toBe('not_installed');
        expect(ExtensionState::Enabled->value)->toBe('enabled');
        expect(ExtensionState::Disabled->value)->toBe('disabled');
        expect(ExtensionState::Errored->value)->toBe('errored');
        expect(ExtensionState::Incompatible->value)->toBe('incompatible');
    });

    test('team extension pivot tracks activation', function () {
        $extension = Extension::create([
            'identifier' => 'lifecycle-test',
            'name' => 'Lifecycle Test',
            'type' => 'module',
            'version' => '1.0.0',
            'state' => ExtensionState::Enabled,
        ]);

        TeamExtension::create([
            'team_id' => $this->team->id,
            'extension_id' => $extension->id,
            'is_active' => true,
            'state' => ExtensionState::Enabled,
        ]);

        $pivot = TeamExtension::where('team_id', $this->team->id)
            ->where('extension_id', $extension->id)
            ->first();

        expect($pivot)->not->toBeNull();
        expect($pivot->is_active)->toBeTrue();
        expect($pivot->state)->toBe(ExtensionState::Enabled);
    });

    test('team can check hasExtensionActive', function () {
        $extension = Extension::create([
            'identifier' => 'active-check',
            'name' => 'Active Check',
            'type' => 'module',
            'version' => '1.0.0',
            'state' => ExtensionState::Enabled,
        ]);

        expect($this->team->hasExtensionActive('active-check'))->toBeFalse();

        TeamExtension::create([
            'team_id' => $this->team->id,
            'extension_id' => $extension->id,
            'is_active' => true,
            'state' => ExtensionState::Enabled,
        ]);

        expect($this->team->fresh()->hasExtensionActive('active-check'))->toBeTrue();
    });

    test('extension model has manifest accessor', function () {
        $extension = Extension::create([
            'identifier' => 'manifest-test',
            'name' => 'Manifest Test',
            'type' => 'module',
            'version' => '2.0.0',
            'state' => ExtensionState::Enabled,
            'manifest_json' => [
                'identifier' => 'manifest-test',
                'permissions' => ['manifest.test.view'],
            ],
        ]);

        $manifest = $extension->manifest();
        expect($manifest)->not->toBeNull();
    });
});
