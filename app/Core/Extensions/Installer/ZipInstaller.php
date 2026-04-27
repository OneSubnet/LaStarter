<?php

namespace App\Core\Extensions\Installer;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use ZipArchive;

class ZipInstaller
{
    public function __construct(
        private string $extensionsPath,
        private int $maxUploadSize,
    ) {}

    /**
     * Install an extension from a ZIP URL (e.g. GitHub release).
     */
    public function installFromUrl(string $url, string $expectedIdentifier): string
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'lastarter_ext_').'.zip';

        try {
            $content = file_get_contents($url);

            if ($content === false) {
                throw new \RuntimeException("Failed to download extension from: {$url}");
            }

            file_put_contents($tempPath, $content);

            return $this->extractAndValidate($tempPath, $expectedIdentifier);
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }

    /**
     * Install an extension from an uploaded ZIP file.
     */
    public function installFromUpload(string $uploadedPath, string $expectedIdentifier): string
    {
        $size = filesize($uploadedPath);

        if ($size > $this->maxUploadSize) {
            throw new \RuntimeException('Uploaded file exceeds maximum size of '.($this->maxUploadSize / 1024 / 1024).'MB');
        }

        return $this->extractAndValidate($uploadedPath, $expectedIdentifier);
    }

    /**
     * Install an extension from a monorepo archive by extracting a subdirectory.
     */
    public function installFromMonorepoArchive(string $url, string $subPath, string $expectedIdentifier): string
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'lastarter_mono_').'.zip';

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/vnd.github+json',
                'X-GitHub-Api-Version' => '2022-11-28',
            ])->withOptions(['verify' => app()->environment('local') ? false : true])
                ->get($url);

            if (! $response->successful()) {
                throw new \RuntimeException("Failed to download monorepo archive from: {$url}");
            }

            file_put_contents($tempPath, $response->body());

            return $this->extractSubDirectory($tempPath, $subPath, $expectedIdentifier);
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }

    /**
     * Extract, validate structure, and place in extensions directory.
     */
    private function extractAndValidate(string $zipPath, string $expectedIdentifier): string
    {
        $this->validateZip($zipPath);

        $zip = new ZipArchive;

        if ($zip->open($zipPath) !== true) {
            throw new \RuntimeException('Failed to open ZIP file');
        }

        // Find the root directory in the ZIP
        $rootDir = $this->detectRootDirectory($zip);

        // Check for extension.json
        $manifestIndex = $zip->locateName("{$rootDir}extension.json");

        if ($manifestIndex === false) {
            $zip->close();
            throw new \RuntimeException('ZIP does not contain an extension.json manifest');
        }

        $manifestContent = $zip->getFromIndex($manifestIndex);
        $manifestData = json_decode($manifestContent, true);

        if (! $manifestData || ! isset($manifestData['identifier'])) {
            $zip->close();
            throw new \RuntimeException('Invalid extension.json manifest');
        }

        if ($manifestData['identifier'] !== $expectedIdentifier) {
            $zip->close();
            throw new \RuntimeException("Extension identifier mismatch: expected {$expectedIdentifier}, got {$manifestData['identifier']}");
        }

        $type = $manifestData['type'] ?? 'module';
        $slug = $manifestData['identifier'];
        $targetPath = "{$this->extensionsPath}/{$type}s/{$slug}";

        // Create target directory
        if (! is_dir($targetPath)) {
            File::makeDirectory($targetPath, 0755, true);
        }

        // Extract files
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);

            // Skip macOS __MACOSX and hidden files
            if (str_contains($name, '__MACOSX') || str_contains($name, '/.')) {
                continue;
            }

            // Remove root directory prefix
            $relativePath = substr($name, strlen($rootDir));

            if ($relativePath === '' || $relativePath === '/') {
                continue;
            }

            $targetFile = $targetPath.'/'.$relativePath;

            if (substr($name, -1) === '/') {
                // Directory
                if (! is_dir($targetFile)) {
                    File::makeDirectory($targetFile, 0755, true);
                }
            } else {
                // File
                $dir = dirname($targetFile);
                if (! is_dir($dir)) {
                    File::makeDirectory($dir, 0755, true);
                }

                $stream = $zip->getStream($name);
                if ($stream) {
                    file_put_contents($targetFile, stream_get_contents($stream));
                    fclose($stream);
                }
            }
        }

        $zip->close();

        return $targetPath;
    }

    /**
     * Detect the root directory prefix in the ZIP.
     */
    private function detectRootDirectory(ZipArchive $zip): string
    {
        $firstEntry = $zip->getNameIndex(0);

        if (str_ends_with($firstEntry, '/')) {
            return $firstEntry;
        }

        return '';
    }

    /**
     * Extract a subdirectory from a monorepo ZIP and install as extension.
     */
    private function extractSubDirectory(string $zipPath, string $subPath, string $expectedIdentifier): string
    {
        $this->validateZip($zipPath);

        $zip = new ZipArchive;

        if ($zip->open($zipPath) !== true) {
            throw new \RuntimeException('Failed to open monorepo archive');
        }

        $rootDir = $this->detectRootDirectory($zip);
        $prefix = "{$rootDir}{$subPath}/";

        // Validate extension.json exists in subdirectory
        $manifestIndex = $zip->locateName("{$prefix}extension.json");

        if ($manifestIndex === false) {
            $zip->close();
            throw new \RuntimeException("Extension manifest not found at {$subPath}/extension.json");
        }

        $manifestContent = $zip->getFromIndex($manifestIndex);
        $manifestData = json_decode($manifestContent, true);

        if (! $manifestData || ! isset($manifestData['identifier'])) {
            $zip->close();
            throw new \RuntimeException('Invalid extension.json manifest');
        }

        if ($manifestData['identifier'] !== $expectedIdentifier) {
            $zip->close();
            throw new \RuntimeException("Extension identifier mismatch: expected {$expectedIdentifier}, got {$manifestData['identifier']}");
        }

        $type = $manifestData['type'] ?? 'module';
        $slug = $manifestData['identifier'];
        $targetPath = "{$this->extensionsPath}/{$type}s/{$slug}";

        if (! is_dir($targetPath)) {
            File::makeDirectory($targetPath, 0755, true);
        }

        $prefixLen = strlen($prefix);

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);

            if (str_contains($name, '__MACOSX') || str_contains($name, '/.')) {
                continue;
            }

            if (! str_starts_with($name, $prefix)) {
                continue;
            }

            $relativePath = substr($name, $prefixLen);

            if ($relativePath === '' || $relativePath === '/') {
                continue;
            }

            $targetFile = $targetPath.'/'.$relativePath;

            if (str_ends_with($name, '/')) {
                if (! is_dir($targetFile)) {
                    File::makeDirectory($targetFile, 0755, true);
                }
            } else {
                $dir = dirname($targetFile);
                if (! is_dir($dir)) {
                    File::makeDirectory($dir, 0755, true);
                }

                $stream = $zip->getStream($name);
                if ($stream) {
                    file_put_contents($targetFile, stream_get_contents($stream));
                    fclose($stream);
                }
            }
        }

        $zip->close();

        return $targetPath;
    }

    /**
     * Validate the ZIP file for basic security.
     */
    private function validateZip(string $path): void
    {
        if (! file_exists($path)) {
            throw new \RuntimeException('ZIP file not found');
        }

        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            throw new \RuntimeException('Invalid ZIP file');
        }

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);

            // Check for path traversal
            if (str_contains($name, '../') || str_contains($name, '..\\')) {
                $zip->close();
                throw new \RuntimeException('ZIP contains path traversal attempt');
            }

            // Check for absolute paths
            if (str_starts_with($name, '/') || str_starts_with($name, '\\')) {
                $zip->close();
                throw new \RuntimeException('ZIP contains absolute paths');
            }
        }

        $zip->close();
    }
}
