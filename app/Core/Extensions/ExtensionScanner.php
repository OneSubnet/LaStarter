<?php

namespace App\Core\Extensions;

use Illuminate\Support\Collection;

class ExtensionScanner
{
    protected string $extensionsPath;

    public function __construct()
    {
        $this->extensionsPath = base_path('extensions');
    }

    /**
     * Scan the /extensions directory for extension.json manifests.
     *
     * @return Collection<ExtensionManifest>
     */
    public function scan(): Collection
    {
        $manifests = collect();

        foreach (['modules', 'themes'] as $type) {
            $typePath = $this->extensionsPath.DIRECTORY_SEPARATOR.$type;

            if (! is_dir($typePath)) {
                continue;
            }

            foreach (scandir($typePath) as $directory) {
                if ($directory === '.' || $directory === '..') {
                    continue;
                }

                $manifestPath = $typePath.DIRECTORY_SEPARATOR.$directory.DIRECTORY_SEPARATOR.'extension.json';

                if (file_exists($manifestPath)) {
                    try {
                        $manifests->push(ExtensionManifest::fromFile($manifestPath));
                    } catch (\InvalidArgumentException $e) {
                        logger()->warning("Failed to parse extension manifest: {$manifestPath} - ".$e->getMessage());
                    }
                }
            }
        }

        return $manifests;
    }
}
