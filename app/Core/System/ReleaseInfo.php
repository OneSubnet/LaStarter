<?php

namespace App\Core\System;

final readonly class ReleaseInfo
{
    public function __construct(
        public string $version,
        public string $tagName,
        public ?string $name,
        public ?string $body,
        public ?string $htmlUrl,
        public ?string $publishedAt,
        public ?string $zipUrl,
        public bool $prerelease,
    ) {}

    public static function fromGithubApi(array $data): self
    {
        $asset = collect($data['assets'] ?? [])
            ->first(fn (array $a) => str_ends_with($a['name'], '.zip'));

        $version = ltrim($data['tag_name'] ?? '0.0.0', 'v');

        return new self(
            version: $version,
            tagName: $data['tag_name'] ?? '',
            name: $data['name'] ?? null,
            body: $data['body'] ?? null,
            htmlUrl: $data['html_url'] ?? null,
            publishedAt: $data['published_at'] ?? null,
            zipUrl: $asset['browser_download_url'] ?? null,
            prerelease: $data['prerelease'] ?? false,
        );
    }
}
