<?php

namespace App\Core\Extensions;

use InvalidArgumentException;

final readonly class ExtensionManifest
{
    /**
     * @param  string  $identifier  Unique slug (e.g. "ailes-invisibles")
     * @param  string  $name  Human-readable name
     * @param  string  $type  "module" or "theme"
     * @param  string  $basePath  Absolute path to the extension directory
     * @param  string|null  $version  Semantic version
     * @param  string|null  $description  Short description
     * @param  class-string|null  $providerClass  Fully-qualified ServiceProvider class
     * @param  string|null  $namespace  PSR-4 namespace root
     * @param  string|null  $author  Author name
     * @param  list<string>  $permissions  Permissions this extension declares
     * @param  array<string, mixed>  $navigation  Sidebar navigation items
     * @param  array<string, mixed>  $settings  Settings form definitions
     * @param  list<string>  $dependencies  Required extension identifiers
     * @param  string|null  $minimumCoreVersion  Minimum LaStarter version
     * @param  list<string>  $provides  API contracts this module exposes
     * @param  array<string, mixed>  $widgets  Dashboard widget definitions
     * @param  array<string, mixed>  $metrics  Metric definitions
     * @param  array<string, mixed>  $raw  Original decoded JSON
     */
    public function __construct(
        public string $identifier,
        public string $name,
        public string $type,
        public string $basePath,
        public ?string $version,
        public ?string $description,
        public ?string $providerClass,
        public ?string $namespace,
        public ?string $author,
        public array $permissions,
        public array $navigation,
        public array $settings,
        public array $dependencies,
        public ?string $minimumCoreVersion,
        public array $provides,
        public array $widgets,
        public array $metrics,
        public array $raw,
    ) {}

    /**
     * Parse an extension.json file into a typed manifest.
     *
     * @throws InvalidArgumentException if the manifest is invalid
     */
    public static function fromFile(string $basePath): self
    {
        $jsonPath = rtrim($basePath, '/\\').DIRECTORY_SEPARATOR.'extension.json';

        if (! file_exists($jsonPath)) {
            throw new InvalidArgumentException("Manifest not found: {$jsonPath}");
        }

        $raw = json_decode(file_get_contents($jsonPath), true);

        if (! is_array($raw)) {
            throw new InvalidArgumentException("Invalid JSON in manifest: {$jsonPath}");
        }

        return self::fromArray($basePath, $raw);
    }

    /**
     * Build a manifest from a decoded JSON array.
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(string $basePath, array $data): self
    {
        $identifier = $data['identifier'] ?? basename($basePath);

        if (empty($identifier) || ! preg_match('/^[a-z][a-z0-9-]*$/', $identifier)) {
            throw new InvalidArgumentException("Invalid extension identifier: {$identifier}");
        }

        $type = $data['type'] ?? 'module';

        if (! in_array($type, ['module', 'theme', 'language'], true)) {
            throw new InvalidArgumentException("Invalid extension type: {$type}");
        }

        $providerClass = $data['provider'] ?? null;
        $namespace = $data['namespace'] ?? null;

        if ($providerClass) {
            try {
                if (! class_exists($providerClass)) {
                    $providerClass = null;
                }
            } catch (\Throwable) {
                $providerClass = null;
            }
        }

        return new self(
            identifier: $identifier,
            name: $data['name'] ?? $identifier,
            type: $type,
            basePath: rtrim($basePath, '/\\'),
            version: $data['version'] ?? null,
            description: $data['description'] ?? null,
            providerClass: $providerClass,
            namespace: $namespace,
            author: $data['author'] ?? null,
            permissions: $data['permissions'] ?? [],
            navigation: $data['navigation'] ?? [],
            settings: $data['settings'] ?? [],
            dependencies: $data['dependencies'] ?? [],
            minimumCoreVersion: $data['minimum_core_version'] ?? null,
            provides: $data['provides'] ?? [],
            widgets: $data['widgets'] ?? [],
            metrics: $data['metrics'] ?? [],
            raw: $data,
        );
    }

    public function migrationPath(): string
    {
        return $this->basePath.DIRECTORY_SEPARATOR.'database'.DIRECTORY_SEPARATOR.'migrations';
    }

    public function routesPath(): string
    {
        return $this->basePath.DIRECTORY_SEPARATOR.'routes'.DIRECTORY_SEPARATOR.'web.php';
    }

    public function pagesPath(): string
    {
        return $this->basePath.DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages';
    }

    public function localesPath(): string
    {
        return $this->basePath.DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'locales';
    }

    public function srcPath(): string
    {
        return $this->basePath.DIRECTORY_SEPARATOR.'src';
    }

    public function hasMigrations(): bool
    {
        return is_dir($this->migrationPath()) && glob($this->migrationPath().DIRECTORY_SEPARATOR.'*.php') !== [];
    }

    public function hasRoutes(): bool
    {
        return file_exists($this->routesPath());
    }

    public function hasProvider(): bool
    {
        return $this->providerClass !== null;
    }
}
