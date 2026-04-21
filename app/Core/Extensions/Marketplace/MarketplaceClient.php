<?php

namespace App\Core\Extensions\Marketplace;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class MarketplaceClient
{
    public function __construct(
        private string $githubOrg,
        private string $marketplaceRepo,
        private ?string $githubToken = null,
    ) {}

    /**
     * Fetch and parse the index.json from the marketplace monorepo.
     *
     * @return Collection<array{name: string, full_name: string, description: ?string, html_url: string, stargazers_count: int, topics: string[], updated_at: string, type: string, identifier: string, path: string}>
     */
    public function search(string $query = '', string $type = ''): Collection
    {
        $index = $this->fetchIndex();

        if ($index === null) {
            return new Collection;
        }

        return collect($index)
            ->when($type, fn ($c) => $c->where('type', $type))
            ->when($query, fn ($c) => $c->filter(function (array $item) use ($query) {
                $q = strtolower($query);

                return str_contains(strtolower($item['name'] ?? ''), $q)
                    || str_contains(strtolower($item['description'] ?? ''), $q)
                    || str_contains(strtolower($item['identifier'] ?? ''), $q);
            }))
            ->map(fn (array $item) => [
                'name' => $item['name'] ?? $item['identifier'],
                'full_name' => "{$this->githubOrg}/{$this->marketplaceRepo}",
                'description' => $item['description'] ?? null,
                'html_url' => "https://github.com/{$this->githubOrg}/{$this->marketplaceRepo}/tree/main/{$item['path']}",
                'stargazers_count' => $item['stargazers_count'] ?? 0,
                'topics' => $item['topics'] ?? ["lastarter-{$item['type']}"],
                'updated_at' => $item['updated_at'] ?? now()->toISOString(),
                'type' => $item['type'],
                'identifier' => $item['identifier'],
                'path' => $item['path'],
            ])
            ->values();
    }

    /**
     * Get details for a specific extension from the index.
     */
    public function getDetails(string $owner, string $repo): ?array
    {
        if ($owner !== $this->githubOrg || $repo !== $this->marketplaceRepo) {
            return null;
        }

        $response = $this->http()
            ->get("https://api.github.com/repos/{$owner}/{$repo}");

        if (! $response->successful()) {
            return null;
        }

        $data = $response->json();

        return [
            'name' => $data['name'],
            'full_name' => $data['full_name'],
            'description' => $data['description'],
            'html_url' => $data['html_url'],
            'stargazers_count' => $data['stargazers_count'],
            'topics' => $data['topics'] ?? [],
            'license' => $data['license']['spdx_id'] ?? null,
            'default_branch' => $data['default_branch'],
            'updated_at' => $data['updated_at'],
        ];
    }

    /**
     * Get the README content for an extension subdirectory.
     */
    public function getReadme(string $owner, string $repo, string $path = ''): ?string
    {
        $url = $path
            ? "https://api.github.com/repos/{$owner}/{$repo}/contents/{$path}/README.md"
            : "https://api.github.com/repos/{$owner}/{$repo}/readme";

        $response = $this->http()
            ->accept('application/vnd.github.raw')
            ->get($url);

        if (! $response->successful()) {
            return null;
        }

        return $response->body();
    }

    /**
     * Get the latest release for the monorepo.
     */
    public function getLatestRelease(string $owner, string $repo): ?array
    {
        $response = $this->http()
            ->get("https://api.github.com/repos/{$owner}/{$repo}/releases/latest");

        if (! $response->successful()) {
            return null;
        }

        $data = $response->json();
        $zipAsset = collect($data['assets'] ?? [])
            ->first(fn (array $asset) => str_ends_with($asset['name'], '.zip'));

        return [
            'tag_name' => $data['tag_name'],
            'name' => $data['name'],
            'body' => $data['body'],
            'published_at' => $data['published_at'],
            'zip_url' => $zipAsset ? $zipAsset['browser_download_url'] : null,
            'html_url' => $data['html_url'],
        ];
    }

    /**
     * Fetch the extension.json manifest from a subdirectory.
     */
    public function getManifest(string $owner, string $repo, string $ref = 'main', string $path = ''): ?array
    {
        $url = $path
            ? "https://api.github.com/repos/{$owner}/{$repo}/contents/{$path}/extension.json"
            : "https://api.github.com/repos/{$owner}/{$repo}/contents/extension.json";

        $response = $this->http()
            ->accept('application/vnd.github.raw')
            ->get($url, ['ref' => $ref]);

        if (! $response->successful()) {
            return null;
        }

        return json_decode($response->body(), true);
    }

    /**
     * Find an extension by identifier from the index.
     */
    public function findByIdentifier(string $identifier): ?array
    {
        return $this->fetchIndex()?->first(
            fn (array $item) => ($item['identifier'] ?? '') === $identifier,
        );
    }

    /**
     * Fetch the index.json from the monorepo (with caching).
     *
     * @return Collection<array>|null
     */
    protected function fetchIndex(): ?Collection
    {
        $data = cache()->remember('marketplace.index', now()->addHour(), function () {
            $response = $this->http()
                ->accept('application/vnd.github.raw')
                ->get("https://api.github.com/repos/{$this->githubOrg}/{$this->marketplaceRepo}/contents/index.json");

            if (! $response->successful()) {
                return null;
            }

            $data = json_decode($response->body(), true);

            if (! is_array($data)) {
                return null;
            }

            return $data;
        });

        if ($data === null) {
            return null;
        }

        return collect($data);
    }

    private function http()
    {
        $headers = [
            'Accept' => 'application/vnd.github+json',
            'X-GitHub-Api-Version' => '2022-11-28',
        ];

        if ($this->githubToken) {
            $headers['Authorization'] = 'Bearer '.$this->githubToken;
        }

        return Http::withHeaders($headers)
            ->timeout(15)
            ->when(app()->environment('local'), fn ($http) => $http->withoutVerifying());
    }
}
