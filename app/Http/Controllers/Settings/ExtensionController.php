<?php

namespace App\Http\Controllers\Settings;

use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\Updater\UpdateService;
use App\Http\Controllers\Controller;
use App\Models\Extension;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class ExtensionController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('system.update');
        $manager = app(ExtensionManager::class);
        $team = $request->user()->currentTeam;

        $extensions = Extension::query()
            ->whereNotNull('state')
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(fn (Extension $ext) => [
                'id' => $ext->id,
                'identifier' => $ext->identifier,
                'name' => $ext->name,
                'type' => $ext->type,
                'version' => $ext->version,
                'description' => $ext->description,
                'author' => $ext->author,
                'state' => $ext->state,
                'is_enabled' => $team ? $manager->isEnabled($ext->identifier, $team->id) : false,
            ]);

        return Inertia::render('settings/extensions', [
            'extensions' => $extensions,
        ]);
    }

    public function show(Request $request): Response
    {
        Gate::authorize('system.update');
        $extension = $this->resolveExtension($request);
        $manager = app(ExtensionManager::class);
        $team = $request->user()->currentTeam;
        $manifest = $manager->manifest($extension->identifier);

        $updateAvailable = false;
        $latestVersion = null;

        try {
            $updates = app(UpdateService::class)->checkForUpdates();
            $updateInfo = $updates->get($extension->identifier);

            if ($updateInfo) {
                $updateAvailable = true;
                $latestVersion = $updateInfo->latestVersion;
            }
        } catch (\Throwable) {
            // Marketplace not configured
        }

        return Inertia::render('settings/extensions-show', [
            'extension' => [
                'id' => $extension->id,
                'identifier' => $extension->identifier,
                'name' => $extension->name,
                'type' => $extension->type,
                'version' => $extension->version,
                'description' => $extension->description,
                'author' => $extension->author,
                'state' => $extension->state,
                'permissions' => $extension->permissions ?? [],
                'is_enabled' => $team ? $manager->isEnabled($extension->identifier, $team->id) : false,
                'has_routes' => $manifest?->hasRoutes() ?? false,
                'has_migrations' => $manifest?->hasMigrations() ?? false,
                'update_available' => $updateAvailable,
                'latest_version' => $latestVersion,
            ],
        ]);
    }

    public function install(Request $request): RedirectResponse
    {
        Gate::authorize('system.update');
        $identifier = $this->resolveIdentifier($request);

        app(ExtensionManager::class)->install($identifier);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension installed.')]);

        return back();
    }

    public function uninstall(Request $request): RedirectResponse
    {
        Gate::authorize('system.update');
        $identifier = $this->resolveIdentifier($request);

        $backupPath = app(ExtensionManager::class)->uninstall(
            $identifier,
            $request->boolean('backup'),
        );

        $message = __('Extension uninstalled.');

        if ($backupPath) {
            $message .= ' '.__('Backup saved to :path.', ['path' => basename($backupPath)]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    public function enable(Request $request): RedirectResponse
    {
        Gate::authorize('system.update');
        $identifier = $this->resolveIdentifier($request);
        $team = $request->user()->currentTeam;

        if (! $team) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('No team context.')]);

            return back();
        }

        app(ExtensionManager::class)->enable($identifier, $team->id);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension enabled.')]);

        return back();
    }

    public function disable(Request $request): RedirectResponse
    {
        Gate::authorize('system.update');
        $identifier = $this->resolveIdentifier($request);
        $team = $request->user()->currentTeam;

        if (! $team) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('No team context.')]);

            return back();
        }

        app(ExtensionManager::class)->disable($identifier, $team->id);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension disabled.')]);

        return back();
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('system.update');
        $identifier = $this->resolveIdentifier($request);
        $report = app(UpdateService::class)->updateWithReport($identifier);

        if ($report->compatible) {
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension updated.')]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'error', 'message' => __('Update blocked: :errors', ['errors' => implode(', ', $report->errors)])]);

        return back();
    }

    public function batchEnable(Request $request): RedirectResponse
    {
        Gate::authorize('system.update');
        $team = $request->user()->currentTeam;

        if (! $team) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('No team context.')]);

            return back();
        }

        $identifiers = $request->validate([
            'identifiers' => ['required', 'array'],
            'identifiers.*' => ['string'],
        ])['identifiers'];

        $manager = app(ExtensionManager::class);

        foreach ($identifiers as $identifier) {
            try {
                $manager->enable($identifier, $team->id);
            } catch (\Throwable) {
                // Skip extensions that fail to enable (missing deps, etc.)
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extensions enabled.')]);

        return back();
    }

    public function batchDisable(Request $request): RedirectResponse
    {
        Gate::authorize('system.update');
        $team = $request->user()->currentTeam;

        if (! $team) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('No team context.')]);

            return back();
        }

        $identifiers = $request->validate([
            'identifiers' => ['required', 'array'],
            'identifiers.*' => ['string'],
        ])['identifiers'];

        $manager = app(ExtensionManager::class);

        foreach ($identifiers as $identifier) {
            try {
                $manager->disable($identifier, $team->id);
            } catch (\Throwable) {
                // Skip extensions that fail to disable (dependents, etc.)
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extensions disabled.')]);

        return back();
    }

    public function checkUpdates(): RedirectResponse
    {
        Gate::authorize('system.update');
        try {
            $updates = app(UpdateService::class)->checkForUpdates();
            $count = $updates->count();

            if ($count > 0) {
                Inertia::flash('toast', ['type' => 'info', 'message' => __(':count updates available.', ['count' => $count])]);

                return back();
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => __('All extensions are up to date.')]);

            return back();
        } catch (\Throwable $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Failed to check updates: :error', ['error' => $e->getMessage()])]);

            return back();
        }
    }

    private function resolveIdentifier(Request $request): string
    {
        return (string) $request->route('extension');
    }

    private function resolveExtension(Request $request): Extension
    {
        return Extension::where('identifier', $this->resolveIdentifier($request))->firstOrFail();
    }
}
