<?php

namespace App\Http\Controllers\Settings;

use App\Core\Extensions\Installer\ZipInstaller;
use App\Core\Extensions\Marketplace\MarketplaceClient;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class MarketplaceController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            Gate::authorize('system.update');

            return $next($request);
        });
    }

    public function index(Request $request): Response
    {
        $client = app(MarketplaceClient::class);

        try {
            $extensions = $client->list()->map(fn ($ext) => [
                'identifier' => $ext->identifier,
                'name' => $ext->name,
                'description' => $ext->description,
                'type' => $ext->type,
                'version' => $ext->version,
                'author' => $ext->author,
                'owner' => $ext->owner,
                'repo' => $ext->repo,
                'github_url' => $ext->githubUrl(),
            ]);
        } catch (\Throwable) {
            $extensions = collect();
        }

        return Inertia::render('settings/marketplace', [
            'extensions' => $extensions,
        ]);
    }

    public function show(Request $request, string $owner, string $repo): Response
    {
        $client = app(MarketplaceClient::class);
        $ext = $client->show($owner, $repo);

        if (! $ext) {
            abort(404, 'Extension not found on marketplace.');
        }

        return Inertia::render('settings/marketplace-show', [
            'extension' => [
                'identifier' => $ext->identifier,
                'name' => $ext->name,
                'description' => $ext->description,
                'type' => $ext->type,
                'version' => $ext->version,
                'author' => $ext->author,
                'owner' => $ext->owner,
                'repo' => $ext->repo,
                'github_url' => $ext->githubUrl(),
                'permissions' => $ext->permissions,
            ],
        ]);
    }

    public function install(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'owner' => 'required|string',
            'repo' => 'required|string',
        ]);

        try {
            $installer = app(ZipInstaller::class);
            $manifest = $installer->installFromGithub($validated['owner'], $validated['repo']);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension :name installed.', ['name' => $manifest->name])]);

            return redirect()->route('settings.team.extensions.show', ['extension' => $manifest->identifier]);
        } catch (\Throwable $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Installation failed: :error', ['error' => $e->getMessage()])]);

            return back();
        }
    }

    public function upload(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:zip|max:51200',
        ]);

        try {
            $installer = app(ZipInstaller::class);
            $manifest = $installer->install($validated['file']->path());
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension :name installed.', ['name' => $manifest->name])]);

            return redirect()->route('settings.team.extensions.show', ['extension' => $manifest->identifier]);
        } catch (\Throwable $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Upload failed: :error', ['error' => $e->getMessage()])]);

            return back();
        }
    }
}
