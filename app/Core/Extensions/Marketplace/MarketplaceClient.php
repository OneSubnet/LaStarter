<?php

namespace App\Core\Extensions\Marketplace;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class MarketplaceClient
{
    public function __construct(
        private string $githubOrg,
        private ?string $githubToken = null,
    ) {}

    /**
     * Search GitHub repos by topic in the configured organization.
     *
     * @return Collection<array{name: string, full_name: string, description: ?string, html_url: string, stargazers_count: int, topics: string[], updated_at: string}>
     */
    public function search(string $query = '', string $type = ''): Collection
    {
        $topic = 'lastarter-extension';

        $q = "org:{$this->githubOrg} topic:{$topic}";

        if ($query) {
            $q .= " {$query} in:name,description";
        }

        $response = $this->http()
            ->get('https://api.github.com/search/repositories', [
                'q' => $q,
                'sort' => 'stars',
                'order' => 'desc',
                'per_page' => 30,
            ]);

        if (! $response->successful()) {
            return new Collection;
        }

        return collect($response->json('items', []))
            ->map(fn (array $repo) => [
                'name' => $repo['name'],
                'full_name' => $repo['full_name'],
                'description' => $repo['description'],
                'html_url' => $repo['html_url'],
                'stargazers_count' => $repo['stargazers_count'],
                'topics' => $repo['topics'] ?? [],
                'updated_at' => $repo['updated_at'],
            ]);
    }

    /**
     * Get details for a specific repo.
     */
    public function getDetails(string $owner, string $repo): ?array
    {
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
     * Get the README content for a repo.
     */
    public function getReadme(string $owner, string $repo): ?string
    {
        $response = $this->http()
            ->accept('application/vnd.github.raw')
            ->get("https://api.github.com/repos/{$owner}/{$repo}/readme");

        if (! $response->successful()) {
            return null;
        }

        return $response->body();
    }

    /**
     * Get the latest release for a repo.
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
     * Fetch the extension.json manifest from a repo.
     */
    public function getManifest(string $owner, string $repo, string $ref = 'main'): ?array
    {
        $response = $this->http()
            ->accept('application/vnd.github.raw')
            ->get("https://api.github.com/repos/{$owner}/{$repo}/contents/extension.json", [
                'ref' => $ref,
            ]);

        if (! $response->successful()) {
            return null;
        }

        return json_decode($response->body(), true);
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
