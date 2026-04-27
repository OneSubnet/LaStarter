<?php

namespace App\Http\Controllers\Settings;

use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\Marketplace\MarketplaceClient;
use App\Core\Themes\ComponentResolver;
use App\Http\Controllers\Controller;
use App\Models\Extension;
use App\Models\TeamSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ExtensionController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Extension::class);

        $team = $request->user()->currentTeam;
        $manager = app(ExtensionManager::class);

        $extensions = $manager->all()->map(function ($extension) use ($manager, $team) {
            $teamExt = $extension->teamExtensions()
                ->where('team_id', $team->id)
                ->first();

            return [
                'id' => $extension->id,
                'name' => $extension->name,
                'identifier' => $extension->identifier,
                'type' => $extension->type,
                'version' => $extension->version,
                'description' => $extension->description,
                'author' => $extension->author,
                'state' => $extension->state->value,
                'error_message' => $extension->error_message,
                'installed_at' => $extension->installed_at?->toISOString(),
                'is_active' => $extension->is_active,
                'is_enabled_for_team' => $extension->is_active && $manager->isEnabled($extension->identifier, $team->id),
                'team_state' => $teamExt?->state?->value ?? 'disabled',
                'license' => $extension->manifest()?->license,
                'homepage' => $extension->manifest()?->homepage,
                'keywords' => $extension->manifest()?->keywords ?? [],
                'lastarter_version' => $extension->manifest()?->lastarterVersion,
                'permissions' => $extension->manifest()?->permissions ?? [],
                'settings' => $extension->manifest()?->settings ?? [],
            ];
        });

        $props = [
            'extensions' => $extensions,
        ];

        // Add marketplace data when requested
        if ($request->query('tab') === 'marketplace') {
            try {
                $marketplace = app(MarketplaceClient::class);
                $query = $request->string('q')->toString();
                $results = $marketplace->search($query);
                $installed = Extension::pluck('identifier')->toArray();
                $results = $results->map(function (array $repo) use ($installed) {
                    $repo['installed'] = in_array($repo['name'], $installed) ||
                        in_array(str_replace('lastarter-', '', $repo['name']), $installed);

                    return $repo;
                });
                $props['marketplace_results'] = $results;
                $props['marketplace_query'] = $query;
            } catch (\Throwable $e) {
                logger()->error('Extension operation failed: '.$e->getMessage());
                $props['marketplace_results'] = [];
                $props['marketplace_query'] = '';
            }
        }

        return Inertia::render('settings/extensions', $props);
    }

    public function show(Request $request): Response
    {
        $id = $request->route('extension');
        $ext = Extension::findOrFail($id);

        Gate::authorize('viewAny', Extension::class);

        $team = $request->user()->currentTeam;
        $manager = app(ExtensionManager::class);
        $teamExt = $ext->teamExtensions()->where('team_id', $team->id)->first();
        $manifest = $ext->manifest();

        return Inertia::render('settings/extensions-show', [
            'extension' => [
                'id' => $ext->id,
                'name' => $ext->name,
                'identifier' => $ext->identifier,
                'type' => $ext->type,
                'version' => $ext->version,
                'description' => $ext->description,
                'author' => $ext->author,
                'state' => $ext->state->value,
                'error_message' => $ext->error_message,
                'installed_at' => $ext->installed_at?->toISOString(),
                'is_active' => $ext->is_active,
                'is_enabled_for_team' => $ext->is_active && $manager->isEnabled($ext->identifier, $team->id),
                'team_state' => $teamExt?->state?->value ?? 'disabled',
                'license' => $manifest?->license,
                'homepage' => $manifest?->homepage,
                'keywords' => $manifest?->keywords ?? [],
                'lastarter_version' => $ext->lastarter_version,
                'settings' => $manifest?->settings ?? [],
            ],
        ]);
    }

    public function install(Request $request): RedirectResponse
    {
        $id = $request->route('extension');
        $extension = Extension::findOrFail($id);

        Gate::authorize('manage', $extension);

        $manager = app(ExtensionManager::class);
        $manager->install($extension->identifier);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension installed.')]);

        return back();
    }

    public function uninstall(Request $request): RedirectResponse
    {
        $id = $request->route('extension');
        $extension = Extension::findOrFail($id);

        Gate::authorize('manage', $extension);

        $manager = app(ExtensionManager::class);
        $manager->uninstall($extension->identifier);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension uninstalled.')]);

        return back();
    }

    public function enable(Request $request): RedirectResponse
    {
        $id = $request->route('extension');
        $extension = Extension::findOrFail($id);

        Gate::authorize('manage', $extension);

        $teamId = $request->user()->currentTeam->id;
        $manager = app(ExtensionManager::class);
        $manager->enable($extension->identifier, $teamId);

        if ($extension->type === 'theme') {
            app(ComponentResolver::class)->setActiveTheme($teamId, $extension->identifier);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension enabled.')]);

        return back();
    }

    public function disable(Request $request): RedirectResponse
    {
        $id = $request->route('extension');
        $extension = Extension::findOrFail($id);

        Gate::authorize('manage', $extension);

        $teamId = $request->user()->currentTeam->id;
        $manager = app(ExtensionManager::class);
        $manager->disable($extension->identifier, $teamId);

        if ($extension->type === 'theme') {
            $resolver = app(ComponentResolver::class);
            if ($resolver->activeTheme($teamId) === $extension->identifier) {
                TeamSetting::where('team_id', $teamId)
                    ->where('key', 'active_theme')
                    ->delete();
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension disabled.')]);

        return back();
    }
}
