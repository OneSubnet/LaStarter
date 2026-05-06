<?php

namespace App\Core\System;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

final readonly class ReleaseClient
{
    private PendingRequest $http;

    public function __construct(
        private string $repo,
        ?string $token = null,
    ) {
        $this->http = Http::baseUrl("https://api.github.com/repos/{$this->repo}")
            ->withHeaders([
                'Accept' => 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version' => '2022-11-28',
            ]);

        if ($token) {
            $this->http = $this->http->withToken($token);
        }
    }

    public function latestRelease(): ?ReleaseInfo
    {
        $response = $this->http->get('/releases/latest');

        if (! $response->successful()) {
            return null;
        }

        return ReleaseInfo::fromGithubApi($response->json());
    }

    public function release(string $version): ?ReleaseInfo
    {
        $response = $this->http->get("/releases/tags/{$version}");

        if (! $response->successful()) {
            return null;
        }

        return ReleaseInfo::fromGithubApi($response->json());
    }

    public function downloadRelease(ReleaseInfo $release): ?string
    {
        if (! $release->zipUrl) {
            return null;
        }

        $zipResponse = Http::get($release->zipUrl);

        if (! $zipResponse->successful()) {
            return null;
        }

        $tmpPath = tempnam(sys_get_temp_dir(), 'core_').'.zip';
        file_put_contents($tmpPath, $zipResponse->body());

        return $tmpPath;
    }
}
