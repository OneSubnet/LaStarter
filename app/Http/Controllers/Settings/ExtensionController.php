<?php

namespace App\Http\Controllers\Settings;

use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\Marketplace\MarketplaceClient;
use App\Http\Controllers\Controller;
use App\Models\Extension;
use App\Services\Contracts\ExtensionServiceInterface;
use App\Services\Contracts\SettingServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ExtensionController extends Controller
{
    public function __construct(
        private ExtensionServiceInterface $extensionService,
        private ExtensionManager $manager,
        private SettingServiceInterface $settings,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Extension::class);

        $team = $request->user()->currentTeam;

        $extensions = $this->manager->all()->map(function ($extension) use ($team) {
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
                'is_enabled_for_team' => $extension->is_active && $this->manager->isEnabled($extension->identifier, $team->id),
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

        if ($request->query('tab') === 'marketplace') {
            try {
                $marketplace = app(MarketplaceClient::class);
                $query = $request->string('q')->toString();
                $results = $marketplace->search($query);
                $installed = $this->extensionService->getAll()
                    ->pluck('identifier')
                    ->toArray();

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
        $identifier = $request->route('extension');
        $extension = $this->extensionService->findByIdentifier($identifier);

        if (! $extension) {
            abort(404);
        }

        Gate::authorize('viewAny', Extension::class);

        $team = $request->user()->currentTeam;
        $teamExt = $extension->teamExtensions()->where('team_id', $team->id)->first();
        $manifest = $extension->manifest();

        return Inertia::render('settings/extensions-show', [
            'extension' => [
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
                'is_enabled_for_team' => $extension->is_active && $this->manager->isEnabled($extension->identifier, $team->id),
                'team_state' => $teamExt?->state?->value ?? 'disabled',
                'license' => $manifest?->license,
                'homepage' => $manifest?->homepage,
                'keywords' => $manifest?->keywords ?? [],
                'lastarter_version' => $extension->lastarter_version,
                'settings' => $manifest?->settings ?? [],
            ],
        ]);
    }

    public function install(Request $request): RedirectResponse
    {
        $identifier = $request->route('extension');
        $extension = $this->extensionService->findByIdentifier($identifier);

        if (! $extension) {
            abort(404);
        }

        Gate::authorize('manage', $extension);

        $this->manager->install($extension->identifier);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension installed.')]);

        return back();
    }

    public function uninstall(Request $request): RedirectResponse
    {
        $identifier = $request->route('extension');
        $extension = $this->extensionService->findByIdentifier($identifier);

        if (! $extension) {
            abort(404);
        }

        Gate::authorize('manage', $extension);

        $this->manager->uninstall($extension->identifier);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension uninstalled.')]);

        return back();
    }

    public function enable(Request $request): RedirectResponse
    {
        $identifier = $request->route('extension');
        $extension = $this->extensionService->findByIdentifier($identifier);

        if (! $extension) {
            abort(404);
        }

        Gate::authorize('manage', $extension);

        $team = $request->user()->currentTeam;

        $this->extensionService->enable($extension, $team);

        if ($extension->type === 'theme') {
            $this->settings->setForTeam($team->id, 'active_theme', $extension->identifier);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension enabled.')]);

        return back();
    }

    public function disable(Request $request): RedirectResponse
    {
        $identifier = $request->route('extension');
        $extension = $this->extensionService->findByIdentifier($identifier);

        if (! $extension) {
            abort(404);
        }

        Gate::authorize('manage', $extension);

        $team = $request->user()->currentTeam;

        $this->extensionService->disable($extension, $team);

        if ($extension->type === 'theme') {
            $activeTheme = $this->settings->getForTeam($team->id, 'active_theme');
            if ($activeTheme === $extension->identifier) {
                $this->settings->removeForTeam($team->id, 'active_theme');
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension disabled.')]);

        return back();
    }
}
