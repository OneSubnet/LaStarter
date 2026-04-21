<?php

namespace App\Http\Controllers\Settings;

use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\Installer\ZipInstaller;
use App\Core\Extensions\Marketplace\MarketplaceClient;
use App\Http\Controllers\Controller;
use App\Models\Extension;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class MarketplaceController extends Controller
{
    public function __construct(
        private MarketplaceClient $marketplace,
        private ZipInstaller $installer,
        private ExtensionManager $extensions,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Extension::class);

        $query = $request->string('q')->toString();
        $type = $request->string('type')->toString();

        $results = $this->marketplace->search($query, $type);

        $installed = Extension::pluck('identifier')->toArray();

        $results = $results->map(function (array $item) use ($installed) {
            $item['installed'] = in_array($item['identifier'], $installed);

            return $item;
        });

        return Inertia::render('settings/marketplace', [
            'results' => $results,
            'query' => $query,
            'type' => $type,
        ]);
    }

    public function show(Request $request, string $owner, string $repo): Response
    {
        Gate::authorize('viewAny', Extension::class);

        $details = $this->marketplace->getDetails($owner, $repo);

        if (! $details) {
            abort(404, __('Repository not found'));
        }

        $identifier = $request->string('extension')->toString();

        $extensionEntry = $identifier
            ? $this->marketplace->findByIdentifier($identifier)
            : null;

        $path = $extensionEntry['path'] ?? '';

        $readme = $this->marketplace->getReadme($owner, $repo, $path);
        $release = $this->marketplace->getLatestRelease($owner, $repo);
        $manifest = $this->marketplace->getManifest($owner, $repo, $details['default_branch'], $path);

        $installed = Extension::where('identifier', $manifest['identifier'] ?? $identifier)->exists();

        return Inertia::render('settings/marketplace-show', [
            'details' => $details,
            'readme' => $readme,
            'release' => $release,
            'manifest' => $manifest,
            'installed' => $installed,
            'extensionPath' => $path,
            'extensionIdentifier' => $identifier,
        ]);
    }

    public function install(Request $request): RedirectResponse
    {
        Gate::authorize('manage', Extension::class);

        $validated = Validator::make($request->all(), [
            'owner' => 'required|string',
            'repo' => 'required|string',
            'identifier' => 'nullable|string',
        ])->validate();

        $release = $this->marketplace->getLatestRelease($validated['owner'], $validated['repo']);

        if (! $release || ! $release['zip_url']) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('No release ZIP found for this extension.')]);

            return back();
        }

        try {
            $identifier = $validated['identifier'] ?? $validated['repo'];
            $path = $this->installer->installFromUrl($release['zip_url'], $identifier);
            $this->extensions->sync();

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension downloaded. Run extensions:scan to register it.')]);
        } catch (\Throwable $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Installation failed: ').$e->getMessage()]);
        }

        return back();
    }

    public function upload(Request $request): RedirectResponse
    {
        Gate::authorize('manage', Extension::class);

        $validated = Validator::make($request->all(), [
            'file' => 'required|file|mimes:zip|max:51200',
            'identifier' => 'required|string',
        ])->validate();

        try {
            $this->installer->installFromUpload(
                $validated['file']->getPathname(),
                $validated['identifier'],
            );
            $this->extensions->sync();

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Extension uploaded and registered.')]);
        } catch (\Throwable $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Upload failed: ').$e->getMessage()]);
        }

        return back();
    }
}
