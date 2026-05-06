<?php

namespace App\Http\Controllers\Settings;

use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\Updater\UpdateService;
use App\Http\Controllers\Controller;
use App\Models\Extension;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ExtensionController extends Controller
{
    public function index(Request $request): Response
    {
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
        $identifier = $this->resolveIdentifier($request);

        app(ExtensionManager::class)->install($identifier);

        return back()->with('toast', ['type' => 'success', 'message' => __('Extension installed.')]);
    }

    public function uninstall(Request $request): RedirectResponse
    {
        $identifier = $this->resolveIdentifier($request);

        app(ExtensionManager::class)->uninstall($identifier);

        return back()->with('toast', ['type' => 'success', 'message' => __('Extension uninstalled.')]);
    }

    public function enable(Request $request): RedirectResponse
    {
        $identifier = $this->resolveIdentifier($request);
        $team = $request->user()->currentTeam;

        if (! $team) {
            return back()->with('toast', ['type' => 'error', 'message' => __('No team context.')]);
        }

        app(ExtensionManager::class)->enable($identifier, $team->id);

        return back()->with('toast', ['type' => 'success', 'message' => __('Extension enabled.')]);
    }

    public function disable(Request $request): RedirectResponse
    {
        $identifier = $this->resolveIdentifier($request);
        $team = $request->user()->currentTeam;

        if (! $team) {
            return back()->with('toast', ['type' => 'error', 'message' => __('No team context.')]);
        }

        app(ExtensionManager::class)->disable($identifier, $team->id);

        return back()->with('toast', ['type' => 'success', 'message' => __('Extension disabled.')]);
    }

    public function update(Request $request): RedirectResponse
    {
        $identifier = $this->resolveIdentifier($request);
        $report = app(UpdateService::class)->updateWithReport($identifier);

        if ($report->compatible) {
            return back()->with('toast', ['type' => 'success', 'message' => __('Extension updated.')]);
        }

        return back()->with('toast', ['type' => 'error', 'message' => __('Update blocked: :errors', ['errors' => implode(', ', $report->errors)])]);
    }

    public function checkUpdates(): RedirectResponse
    {
        try {
            $updates = app(UpdateService::class)->checkForUpdates();
            $count = $updates->count();

            if ($count > 0) {
                return back()->with('toast', ['type' => 'info', 'message' => __(':count updates available.', ['count' => $count])]);
            }

            return back()->with('toast', ['type' => 'success', 'message' => __('All extensions are up to date.')]);
        } catch (\Throwable $e) {
            return back()->with('toast', ['type' => 'error', 'message' => __('Failed to check updates: :error', ['error' => $e->getMessage()])]);
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
