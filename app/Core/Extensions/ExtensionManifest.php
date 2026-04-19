<?php

namespace App\Core\Extensions;

class ExtensionManifest
{
    public function __construct(
        public readonly string $identifier,
        public readonly string $name,
        public readonly string $type,
        public readonly ?string $version = null,
        public readonly ?string $description = null,
        public readonly ?string $providerClass = null,
        public readonly ?string $namespace = null,
        public readonly array $permissions = [],
        public readonly array $navigation = [],
        public readonly array $settings = [],
        public readonly ?string $path = null,
        public readonly ?string $author = null,
        public readonly ?string $url = null,
        public readonly ?string $updateUrl = null,
        public readonly ?string $lastarterVersion = null,
        public readonly ?string $license = null,
        public readonly array $keywords = [],
        public readonly ?string $homepage = null,
        public readonly array $composerPackages = [],
        public readonly array $raw = [],
    ) {}

    /**
     * Parse an extension.json file into a manifest DTO.
     */
    public static function fromFile(string $filePath): self
    {
        if (! file_exists($filePath)) {
            throw new \InvalidArgumentException("Extension manifest not found: {$filePath}");
        }

        $json = json_decode(file_get_contents($filePath), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \InvalidArgumentException("Invalid JSON in manifest: {$filePath}");
        }

        $directory = dirname($filePath);
        $relativePath = str_replace(base_path().DIRECTORY_SEPARATOR, '', $directory);

        return self::fromArray($json, $relativePath);
    }

    /**
     * Create a manifest from an array (e.g. from cached JSON).
     */
    public static function fromArray(array $data, string $path): self
    {
        return new self(
            identifier: $data['identifier'] ?? throw new \InvalidArgumentException('Extension manifest missing "identifier"'),
            name: $data['name'] ?? throw new \InvalidArgumentException('Extension manifest missing "name"'),
            type: $data['type'] ?? throw new \InvalidArgumentException('Extension manifest missing "type"'),
            version: $data['version'] ?? null,
            description: $data['description'] ?? null,
            providerClass: $data['provider'] ?? null,
            namespace: $data['namespace'] ?? null,
            permissions: $data['permissions'] ?? [],
            navigation: $data['navigation'] ?? [],
            settings: $data['settings'] ?? [],
            path: $path,
            author: $data['author'] ?? null,
            url: $data['url'] ?? null,
            updateUrl: $data['update_url'] ?? null,
            lastarterVersion: $data['lastarter_version'] ?? null,
            license: $data['license'] ?? null,
            keywords: $data['keywords'] ?? [],
            homepage: $data['homepage'] ?? null,
            composerPackages: $data['composer_packages'] ?? [],
            raw: $data,
        );
    }

    /**
     * Convert to array for storage.
     */
    public function toArray(): array
    {
        return $this->raw;
    }
}
