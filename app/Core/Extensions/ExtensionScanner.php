<?php

namespace App\Core\Extensions;

use Illuminate\Support\Collection;

final class ExtensionScanner
{
    /** @var string Absolute base path for extensions */
    private readonly string $basePath;

    public function __construct(?string $basePath = null)
    {
        $this->basePath = $basePath ?? base_path('extensions');
    }

    /**
     * Scan all extension directories and return parsed manifests.
     *
     * @return Collection<string, ExtensionManifest> Keyed by identifier
     */
    public function scan(): Collection
    {
        $manifests = new Collection;

        foreach (['modules', 'themes'] as $type) {
            $dir = $this->basePath.DIRECTORY_SEPARATOR.$type;

            if (! is_dir($dir)) {
                continue;
            }

            foreach (glob($dir.DIRECTORY_SEPARATOR.'*', GLOB_ONLYDIR) as $extensionDir) {
                $manifest = $this->parseDirectory($extensionDir);

                if ($manifest !== null) {
                    $manifests->put($manifest->identifier, $manifest);
                }
            }
        }

        return $manifests;
    }

    /**
     * Scan a single extension by identifier.
     */
    public function scanSingle(string $identifier): ?ExtensionManifest
    {
        foreach (['modules', 'themes'] as $type) {
            $dir = $this->basePath.DIRECTORY_SEPARATOR.$type.DIRECTORY_SEPARATOR.$identifier;

            if (is_dir($dir)) {
                return $this->parseDirectory($dir);
            }
        }

        return null;
    }

    private function parseDirectory(string $path): ?ExtensionManifest
    {
        try {
            return ExtensionManifest::fromFile($path);
        } catch (\InvalidArgumentException) {
            return null;
        }
    }
}
