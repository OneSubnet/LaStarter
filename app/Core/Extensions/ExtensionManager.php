<?php

namespace App\Core\Extensions;

use App\Core\Hooks\Hook;
use App\Enums\TeamRole;
use App\Models\Extension;
use App\Models\TeamExtension;
use Composer\Semver\Semver;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ExtensionManager
{
    public function __construct(private ExtensionScanner $scanner) {}

    /**
     * Scan the /extensions directory for extension.json manifests.
     *
     * @return Collection<ExtensionManifest>
     */
    public function scan(): Collection
    {
        return $this->scanner->scan();
    }

    /**
     * Sync scanned extensions into the database.
     *
     * @return array{created: int, updated: int, removed: int}
     */
    public function sync(): array
    {
        $manifests = $this->scan();
        $created = 0;
        $updated = 0;

        $scannedIdentifiers = $manifests->pluck('identifier')->toArray();

        foreach ($manifests as $manifest) {
            $extension = Extension::where('identifier', $manifest->identifier)->first();

            $data = [
                'name' => $manifest->name,
                'type' => $manifest->type,
                'version' => $manifest->version,
                'description' => $manifest->description,
                'path' => $manifest->path,
                'provider_class' => $manifest->providerClass,
                'author' => $manifest->author,
                'update_url' => $manifest->updateUrl,
                'lastarter_version' => $manifest->lastarterVersion,
                'manifest_json' => $manifest->toArray(),
            ];

            if ($extension) {
                $extension->update($data);
                $updated++;
            } else {
                Extension::create(array_merge($data, [
                    'identifier' => $manifest->identifier,
                    'is_active' => true,
                    'state' => ExtensionState::Enabled,
                    'installed_at' => now(),
                ]));
                $created++;
            }
        }

        $removed = Extension::whereNotIn('identifier', $scannedIdentifiers)->delete();

        $this->syncPermissionsFromManifests($manifests);
        $this->ensureOwnerHasAllPermissions();

        $this->clearCache();

        return compact('created', 'updated', 'removed');
    }

    /**
     * @return Collection<Extension>
     */
    public function all(): Collection
    {
        return Extension::all();
    }

    public function get(string $identifier): ?Extension
    {
        return $this->all()->first(fn (Extension $ext) => $ext->identifier === $identifier);
    }

    /**
     * Get extensions enabled for a specific team (cached).
     *
     * @return Collection<Extension>
     */
    public function enabled(int $teamId): Collection
    {
        $ids = Cache::remember(
            "extensions.enabled.{$teamId}",
            now()->addHour(),
            fn () => $this->resolveEnabledIds($teamId),
        );

        if (empty($ids)) {
            return new Collection;
        }

        return Extension::whereIn('id', $ids)
            ->where('is_active', true)
            ->get();
    }

    public function isEnabled(string $identifier, int $teamId): bool
    {
        return $this->enabled($teamId)
            ->contains(fn (Extension $ext) => $ext->identifier === $identifier);
    }

    public function enable(string $identifier, ?int $teamId = null): void
    {
        $extension = $this->get($identifier);

        if (! $extension) {
            throw new \InvalidArgumentException("Extension not found: {$identifier}");
        }

        // For themes: enforce one active theme per team
        if ($extension->type === 'theme' && $teamId !== null) {
            $this->disableActiveTheme($teamId);
        }

        if ($teamId === null) {
            $extension->update([
                'is_active' => true,
                'state' => ExtensionState::Enabled,
            ]);
        } else {
            TeamExtension::updateOrCreate(
                ['team_id' => $teamId, 'extension_id' => $extension->id],
                ['is_active' => true, 'state' => ExtensionState::Enabled],
            );
        }

        $this->clearCache();

        if ($extension->type === 'theme') {
            Hook::dispatch(Hook::THEME_CHANGED, ['identifier' => $identifier, 'team_id' => $teamId]);
        }

        Hook::dispatch(Hook::EXTENSION_ENABLED, ['identifier' => $identifier, 'team_id' => $teamId]);
    }

    public function disable(string $identifier, ?int $teamId = null): void
    {
        $extension = $this->get($identifier);

        if (! $extension) {
            throw new \InvalidArgumentException("Extension not found: {$identifier}");
        }

        if ($teamId === null) {
            $extension->update([
                'is_active' => false,
                'state' => ExtensionState::Disabled,
            ]);
        } else {
            TeamExtension::where('team_id', $teamId)
                ->where('extension_id', $extension->id)
                ->update(['is_active' => false, 'state' => ExtensionState::Disabled]);
        }

        $this->clearCache();

        Hook::dispatch(Hook::EXTENSION_DISABLED, ['identifier' => $identifier, 'team_id' => $teamId]);
    }

    public function install(string $identifier): void
    {
        $extension = $this->get($identifier);

        if (! $extension) {
            throw new \InvalidArgumentException("Extension not found: {$identifier}");
        }

        if ($extension->state !== ExtensionState::NotInstalled) {
            throw new \RuntimeException("Extension {$identifier} is already installed (state: {$extension->state->value})");
        }

        $manifest = $extension->manifest();

        if ($manifest && $manifest->lastarterVersion && ! $this->checkCompatibility($manifest)) {
            $extension->markAsIncompatible();

            throw new \RuntimeException("Extension {$identifier} requires LaStarter version {$manifest->lastarterVersion}");
        }

        $extension->update([
            'state' => ExtensionState::Disabled,
            'installed_at' => now(),
        ]);

        $this->runExtensionMigrations($extension, 'up');

        Hook::dispatch(Hook::EXTENSION_INSTALLED, ['identifier' => $identifier]);
    }

    public function uninstall(string $identifier): void
    {
        $extension = $this->get($identifier);

        if (! $extension) {
            throw new \InvalidArgumentException("Extension not found: {$identifier}");
        }

        $this->runExtensionMigrations($extension, 'down');

        TeamExtension::where('extension_id', $extension->id)->delete();

        if ($extension->path && is_dir(base_path($extension->path))) {
            File::deleteDirectory(base_path($extension->path));
        }

        $extension->delete();

        $this->clearCache();

        Hook::dispatch(Hook::EXTENSION_UNINSTALLED, ['identifier' => $identifier]);
    }

    public function checkCompatibility(ExtensionManifest $manifest): bool
    {
        if (! $manifest->lastarterVersion) {
            return true;
        }

        $appVersion = app()->version();

        return Semver::satisfies($appVersion, $manifest->lastarterVersion);
    }

    protected function disableActiveTheme(int $teamId): void
    {
        $activeThemes = $this->enabled($teamId)->filter(
            fn (Extension $ext) => $ext->type === 'theme'
        );

        foreach ($activeThemes as $theme) {
            TeamExtension::where('team_id', $teamId)
                ->where('extension_id', $theme->id)
                ->update(['is_active' => false, 'state' => ExtensionState::Disabled]);
        }
    }

    protected function runExtensionMigrations(Extension $extension, string $direction): void
    {
        $migrationPath = base_path($extension->path.'/database/migrations');

        if (! is_dir($migrationPath)) {
            return;
        }

        $migrator = app('migrator');

        if ($direction === 'up') {
            $migrator->run($migrationPath);
        } else {
            $migrator->rollback($migrationPath);
        }
    }

    /**
     * @return Collection<string>
     */
    public function activeProviders(): Collection
    {
        return $this->all()
            ->filter(fn (Extension $ext) => $ext->is_active && $ext->provider_class)
            ->pluck('provider_class');
    }

    public function getManifest(string $identifier): ?ExtensionManifest
    {
        return $this->get($identifier)?->manifest();
    }

    public function registerAutoloaders(): void
    {
        foreach ($this->all() as $extension) {
            $manifest = $extension->manifest();

            if (! $manifest || ! $manifest->namespace || ! $manifest->providerClass) {
                continue;
            }

            $prefix = $manifest->namespace.'\\';
            $basePath = base_path($extension->path.DIRECTORY_SEPARATOR.'src');

            spl_autoload_register(function (string $class) use ($prefix, $basePath) {
                if (! str_starts_with($class, $prefix)) {
                    return;
                }

                $relativeClass = substr($class, strlen($prefix));
                $file = $basePath.DIRECTORY_SEPARATOR.str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass).'.php';

                if (file_exists($file)) {
                    require $file;
                }
            });
        }
    }

    public function clearCache(): void
    {
        $teamIds = TeamExtension::distinct()->pluck('team_id');

        foreach ($teamIds as $id) {
            Cache::forget("extensions.enabled.{$id}");
        }

        Cache::forget('extensions.active_providers');
    }

    protected function resolveEnabled(int $teamId): Collection
    {
        $teamExtensionIds = TeamExtension::where('team_id', $teamId)
            ->where('is_active', true)
            ->pluck('extension_id');

        return Extension::whereIn('id', $teamExtensionIds)
            ->where('is_active', true)
            ->get();
    }

    protected function resolveEnabledIds(int $teamId): array
    {
        return TeamExtension::where('team_id', $teamId)
            ->where('is_active', true)
            ->pluck('extension_id')
            ->toArray();
    }

    protected function syncPermissionsFromManifests(Collection $manifests): void
    {
        foreach ($manifests as $manifest) {
            if (empty($manifest->permissions)) {
                continue;
            }

            foreach ($manifest->permissions as $permissionName) {
                Permission::firstOrCreate(
                    ['name' => $permissionName, 'guard_name' => 'web'],
                );
            }
        }
    }

    /**
     * Sync a single extension by scanning its manifest file.
     */
    public function syncSingle(string $identifier): ?Extension
    {
        $manifest = $this->scan()->first(
            fn (ExtensionManifest $m) => $m->identifier === $identifier,
        );

        if (! $manifest) {
            return null;
        }

        $extension = Extension::where('identifier', $identifier)->first();

        $data = [
            'name' => $manifest->name,
            'type' => $manifest->type,
            'version' => $manifest->version,
            'description' => $manifest->description,
            'path' => $manifest->path,
            'provider_class' => $manifest->providerClass,
            'author' => $manifest->author,
            'update_url' => $manifest->updateUrl,
            'lastarter_version' => $manifest->lastarterVersion,
            'manifest_json' => $manifest->toArray(),
        ];

        if ($extension) {
            $extension->update($data);
        } else {
            $extension = Extension::create(array_merge($data, [
                'identifier' => $identifier,
                'is_active' => true,
                'state' => ExtensionState::Enabled,
                'installed_at' => now(),
            ]));

            $this->runExtensionMigrations($extension, 'up');
        }

        $this->syncPermissionsFromManifests(collect([$manifest]));
        $this->ensureOwnerHasAllPermissions();
        $this->clearCache();

        return $extension;
    }

    protected function ensureOwnerHasAllPermissions(): void
    {
        $allPermissions = Permission::where('guard_name', 'web')->get();

        Role::where('name', TeamRole::Owner->value)->each(function (Role $role) use ($allPermissions) {
            $role->syncPermissions($allPermissions);
        });
    }
}
