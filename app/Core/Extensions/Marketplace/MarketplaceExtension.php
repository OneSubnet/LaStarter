<?php

namespace App\Core\Extensions\Marketplace;

final readonly class MarketplaceExtension
{
    public function __construct(
        public string $identifier,
        public string $name,
        public string $description,
        public string $type,
        public ?string $version,
        public ?string $author,
        public ?string $owner,
        public ?string $repo,
        public ?string $downloadUrl,
        public array $permissions,
        public array $raw,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            identifier: $data['identifier'] ?? '',
            name: $data['name'] ?? '',
            description: $data['description'] ?? '',
            type: $data['type'] ?? 'module',
            version: $data['version'] ?? null,
            author: $data['author'] ?? null,
            owner: $data['owner'] ?? null,
            repo: $data['repo'] ?? null,
            downloadUrl: $data['download_url'] ?? null,
            permissions: $data['permissions'] ?? [],
            raw: $data,
        );
    }

    public function isValid(): bool
    {
        return $this->identifier !== '' && $this->name !== '';
    }

    public function githubUrl(): ?string
    {
        if ($this->owner && $this->repo) {
            return "https://github.com/{$this->owner}/{$this->repo}";
        }

        return null;
    }
}
