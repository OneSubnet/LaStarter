<?php

namespace App\Core\Extensions;

use App\Core\Hooks\Hook;
use App\Enums\TeamRole;
use App\Models\Extension;
use App\Models\TeamExtension;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

final class ExtensionManager
{
    /** @var Collection<string, ExtensionManifest>|null */
    private ?Collection $manifests = null;

    public function __construct(
        private readonly ExtensionScanner $scanner,
        private readonly DependencyResolver $dependencyResolver,
    ) {}

    // ──────────────────────────────────────────────
    // Scanning & Syncing
    // ──────────────────────────────────────────────

    /**
     * @return Collection<string, ExtensionManifest>
     */
    public function manifests(): Collection
    {
        if ($this->manifests === null) {
            $this->manifests = $this->scanner->scan();
        }

        return $this->manifests;
    }

    public function manifest(string $identifier): ?ExtensionManifest
    {
        if ($this->manifests()->has($identifier)) {
            return $this->manifests()->get($identifier);
        }

        $manifest = $this->scanner->scanSingle($identifier);

        if ($manifest !== null) {
            $this->manifests->put($identifier, $manifest);
        }

        return $manifest;
    }

    /**
     * Scan filesystem, upsert DB records, sync declared permissions.
     */
    public function sync(): void
    {
        $manifests = $this->scanner->scan();
        $this->manifests = $manifests;

        foreach ($manifests as $manifest) {
            $this->syncExtension($manifest);
        }

        // Remove DB records for extensions no longer on disk
        Extension::whereNotIn('identifier', $manifests->keys()->all())->delete();
    }

    private function syncExtension(ExtensionManifest $manifest): void
    {
        Extension::updateOrCreate(
            ['identifier' => $manifest->identifier],
            [
                'name' => $manifest->name,
                'type' => $manifest->type,
                'version' => $manifest->version,
                'description' => $manifest->description,
                'author' => $manifest->author,
                'provider_class' => $manifest->providerClass,
                'namespace' => $manifest->namespace,
                'permissions' => $manifest->permissions,
                'navigation' => $manifest->navigation,
                'settings' => $manifest->settings,
                'path' => $manifest->basePath,
                'dependencies' => $manifest->dependencies,
                'minimum_core_version' => $manifest->minimumCoreVersion,
                'provides' => $manifest->provides,
                'widgets' => $manifest->widgets,
                'metrics' => $manifest->metrics,
            ],
        );

        $this->syncPermissions($manifest);
    }

    private function syncPermissions(ExtensionManifest $manifest): void
    {
        foreach ($manifest->permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web'],
            );
        }
    }

    // ──────────────────────────────────────────────
    // Lifecycle
    // ──────────────────────────────────────────────

    /**
     * Install: run migrations, set state to Disabled.
     */
    public function install(string $identifier): void
    {
        $manifest = $this->manifest($identifier);
        $extension = $this->findOrThrow($identifier);

        if ($extension->state !== null && $extension->state !== ExtensionState::Disabled->value) {
            return;
        }

        if ($manifest?->hasMigrations()) {
            $this->runMigrations($manifest, 'up');
        }

        $extension->update(['state' => ExtensionState::Disabled->value]);

        Hook::dispatch(Hook::EXTENSION_INSTALLED, $identifier);
    }

    /**
     * Enable an extension for a specific team.
     */
    public function enable(string $identifier, int $teamId): void
    {
        $missing = $this->dependencyResolver->missingDependencies($identifier);

        if ($missing !== []) {
            throw new \RuntimeException("Cannot enable '{$identifier}': missing dependencies: ".implode(', ', $missing));
        }

        $extension = $this->findOrThrow($identifier);

        if ($extension->state === null) {
            $this->install($identifier);
        }

        TeamExtension::updateOrCreate(
            ['extension_id' => $extension->id, 'team_id' => $teamId],
            ['is_active' => true],
        );

        $this->syncTeamPermissions($identifier, $teamId);

        Hook::dispatch(Hook::EXTENSION_ENABLED, $identifier);
    }

    /**
     * Disable an extension for a specific team.
     */
    public function disable(string $identifier, int $teamId): void
    {
        $dependents = $this->dependencyResolver->dependents($identifier);

        if ($dependents !== []) {
            throw new \RuntimeException("Cannot disable '{$identifier}': depended on by: ".implode(', ', $dependents));
        }

        $extension = $this->findOrThrow($identifier);

        TeamExtension::where('extension_id', $extension->id)
            ->where('team_id', $teamId)
            ->update(['is_active' => false]);

        Hook::dispatch(Hook::EXTENSION_DISABLED, $identifier);
    }

    /**
     * Uninstall: disable all teams, rollback migrations, delete DB record.
     */
    public function uninstall(string $identifier): void
    {
        $manifest = $this->manifest($identifier);
        $extension = $this->findOrThrow($identifier);

        TeamExtension::where('extension_id', $extension->id)->delete();

        if ($manifest?->hasMigrations()) {
            $this->runMigrations($manifest, 'down');
        }

        $extension->delete();

        Hook::dispatch(Hook::EXTENSION_UNINSTALLED, $identifier);
    }

    // ──────────────────────────────────────────────
    // Queries
    // ──────────────────────────────────────────────

    public function isEnabled(string $identifier, int $teamId): bool
    {
        return TeamExtension::query()
            ->where('is_active', true)
            ->where('team_id', $teamId)
            ->whereHas('extension', fn ($q) => $q->where('identifier', $identifier))
            ->exists();
    }

    /**
     * @return list<string> Identifiers of enabled extensions for a team
     */
    public function enabledIdentifiers(int $teamId): array
    {
        return Extension::query()
            ->where('state', '!=', null)
            ->whereHas('teamExtensions', fn ($q) => $q->where('team_id', $teamId)->where('is_active', true))
            ->pluck('identifier')
            ->all();
    }

    /**
     * @return list<class-string> Provider classes for all globally installed extensions
     */
    public function activeProviders(): array
    {
        try {
            return Extension::query()
                ->whereNotNull('provider_class')
                ->whereNotNull('state')
                ->pluck('provider_class')
                ->filter(function ($class) {
                    try {
                        return class_exists($class);
                    } catch (\Throwable) {
                        return false;
                    }
                })
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Return provider classes sorted by dependency order (dependencies first).
     *
     * @return list<class-string>
     */
    public function orderedProviders(): array
    {
        try {
            $extensions = Extension::query()
                ->whereNotNull('provider_class')
                ->whereNotNull('state')
                ->get();

            $identifiers = $extensions->pluck('identifier')->all();
            $providerMap = $extensions->pluck('provider_class', 'identifier')->all();

            try {
                $ordered = $this->dependencyResolver->resolveOrder($identifiers);
            } catch (CircularDependencyException) {
                return array_values(array_filter($providerMap));
            }

            $result = [];
            foreach ($ordered as $id) {
                $class = $providerMap[$id] ?? null;
                if ($class && class_exists($class)) {
                    $result[] = $class;
                }
            }

            return $result;
        } catch (\Throwable) {
            return $this->activeProviders();
        }
    }

    // ──────────────────────────────────────────────
    // Autoloading
    // ──────────────────────────────────────────────

    public function registerAutoloaders(): void
    {
        foreach ($this->manifests() as $manifest) {
            if ($manifest->namespace && is_dir($manifest->srcPath())) {
                spl_autoload_register(function (string $class) use ($manifest): void {
                    $prefix = $manifest->namespace.'\\';

                    if (! str_starts_with($class, $prefix)) {
                        return;
                    }

                    $relativeClass = substr($class, strlen($prefix));
                    $file = $manifest->srcPath().DIRECTORY_SEPARATOR.str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass).'.php';

                    if (file_exists($file)) {
                        require_once $file;
                    }
                });
            }
        }
    }

    // ──────────────────────────────────────────────
    // Migration helpers
    // ──────────────────────────────────────────────

    private function runMigrations(ExtensionManifest $manifest, string $direction): void
    {
        $path = $manifest->migrationPath();

        if (! is_dir($path)) {
            return;
        }

        try {
            $migrator = app('migrator');

            if ($direction === 'up') {
                $migrator->run($path);
            } else {
                $migrator->rollback($path);
            }
        } catch (\Throwable $e) {
            Log::error("Extension migration failed for {$manifest->identifier}: {$e->getMessage()}");

            Extension::where('identifier', $manifest->identifier)
                ->update(['state' => ExtensionState::Errored->value]);
        }
    }

    // ──────────────────────────────────────────────
    // Permission sync
    // ──────────────────────────────────────────────

    private function syncTeamPermissions(string $identifier, int $teamId): void
    {
        $manifest = $this->manifest($identifier);

        if ($manifest === null || $manifest->permissions === []) {
            return;
        }

        $permissions = Permission::whereIn('name', $manifest->permissions)
            ->where('guard_name', 'web')
            ->get();

        $ownerRole = Role::where('name', TeamRole::Owner->value)
            ->where('team_id', $teamId)
            ->first();

        $ownerRole?->givePermissionTo($permissions);

        $adminRole = Role::where('name', TeamRole::Admin->value)
            ->where('team_id', $teamId)
            ->first();

        $adminRole?->givePermissionTo($permissions);
    }

    private function findOrThrow(string $identifier): Extension
    {
        $extension = Extension::where('identifier', $identifier)->first();

        if ($extension === null) {
            throw new \RuntimeException("Extension not found in database: {$identifier}. Run extensions:sync first.");
        }

        return $extension;
    }
}
