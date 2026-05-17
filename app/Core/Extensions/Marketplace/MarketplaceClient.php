<?php

namespace App\Core\Extensions\Marketplace;

use App\Models\Extension;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

final readonly class MarketplaceClient
{
    private PendingRequest $http;

    public function __construct(
        private string $githubOrg,
        private string $marketplaceRepo,
        ?string $githubToken = null,
    ) {
        $this->http = Http::baseUrl("https://api.github.com/repos/{$this->githubOrg}/{$this->marketplaceRepo}")
            ->withHeaders([
                'Accept' => 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version' => '2022-11-28',
            ]);

        if ($githubToken) {
            $this->http = $this->http->withToken($githubToken);
        }
    }

    /**
     * List all available extensions from the marketplace index.
     *
     * @return Collection<int, MarketplaceExtension>
     */
    public function list(): Collection
    {
        $response = $this->http->get('/contents/index.json');

        if (! $response->successful()) {
            return new Collection;
        }

        $content = $response->json();

        if (isset($content['content'])) {
            $decoded = json_decode(base64_decode($content['content']), true);
        } else {
            $decoded = $response->json();
        }

        if (! is_array($decoded)) {
            return new Collection;
        }

        return collect($decoded)
            ->map(fn (array $item) => MarketplaceExtension::fromArray($item))
            ->filter(fn (MarketplaceExtension $ext) => $ext->isValid());
    }

    /**
     * Get details for a specific extension from the marketplace.
     */
    public function show(string $owner, string $repo): ?MarketplaceExtension
    {
        $response = Http::github()
            ->get("https://api.github.com/repos/{$owner}/{$repo}/contents/extension.json");

        if (! $response->successful()) {
            return null;
        }

        $content = $response->json();

        if (isset($content['content'])) {
            $decoded = json_decode(base64_decode($content['content']), true);
        } else {
            $decoded = $response->json();
        }

        if (! is_array($decoded)) {
            return null;
        }

        return MarketplaceExtension::fromArray([
            ...$decoded,
            'owner' => $owner,
            'repo' => $repo,
        ]);
    }

    /**
     * Download a release ZIP from a GitHub repository.
     */
    public function downloadRelease(string $owner, string $repo, ?string $version = null): ?string
    {
        $tag = $version ? "tags/{$version}" : 'latest';

        $response = Http::github()
            ->get("https://api.github.com/repos/{$owner}/{$repo}/releases/{$tag}");

        if (! $response->successful()) {
            return null;
        }

        $release = $response->json();
        $asset = collect($release['assets'] ?? [])
            ->first(fn (array $a) => str_ends_with($a['name'], '.zip'));

        if (! $asset) {
            return null;
        }

        // Validate download URL origin to prevent redirect to malicious host
        $downloadUrl = $asset['browser_download_url'];
        $allowedHosts = ['github.com', 'objects.githubusercontent.com', 'api.github.com'];
        $host = parse_url($downloadUrl, PHP_URL_HOST);

        if (! $host || ! (str_ends_with($host, 'github.com') || in_array($host, $allowedHosts, true))) {
            return null;
        }

        $zipResponse = Http::get($downloadUrl);

        if (! $zipResponse->successful()) {
            return null;
        }

        $tmpPath = tempnam(sys_get_temp_dir(), 'ext_').'.zip';
        file_put_contents($tmpPath, $zipResponse->body());

        return $tmpPath;
    }

    /**
     * Fetch the latest release version for a repository.
     */
    public function latestVersion(string $owner, string $repo): ?string
    {
        $response = Http::github()
            ->get("https://api.github.com/repos/{$owner}/{$repo}/releases/latest");

        if (! $response->successful()) {
            return null;
        }

        return $response->json('tag_name');
    }

    /**
     * Check for updates across all installed extensions.
     *
     * @return Collection<string, UpdateInfo> Keyed by identifier
     */
    public function checkUpdates(): Collection
    {
        $extensions = Extension::whereNotNull('state')->get();
        $updates = new Collection;

        foreach ($extensions as $extension) {
            $raw = $extension->raw ?? [];

            $owner = $raw['marketplace_owner'] ?? null;
            $repo = $raw['marketplace_repo'] ?? null;

            if (! $owner || ! $repo) {
                continue;
            }

            $latest = $this->latestVersion($owner, $repo);

            if ($latest && $latest !== $extension->version) {
                $updates->put($extension->identifier, new UpdateInfo(
                    identifier: $extension->identifier,
                    currentVersion: $extension->version ?? '0.0.0',
                    latestVersion: $latest,
                    owner: $owner,
                    repo: $repo,
                ));
            }
        }

        return $updates;
    }
}
