<?php

namespace App\Core\Extensions\Installer;

use App\Core\Extensions\ExtensionManifest;
use Illuminate\Support\Facades\File;
use ZipArchive;

final class ZipInstaller
{
    public function __construct(
        private readonly string $extensionsPath,
        private readonly int $maxUploadSize = 52428800,
    ) {}

    /**
     * Install an extension from a ZIP file.
     *
     * @throws ZipInstallerException on failure
     */
    public function install(string $zipPath, bool $cleanup = true): ExtensionManifest
    {
        if (! file_exists($zipPath)) {
            throw ZipInstallerException::fileNotFound($zipPath);
        }

        if (filesize($zipPath) > $this->maxUploadSize) {
            throw ZipInstallerException::fileTooLarge($this->maxUploadSize);
        }

        $zip = new ZipArchive;

        if ($zip->open($zipPath) !== true) {
            throw ZipInstallerException::invalidZip();
        }

        // Find the root directory inside the ZIP (may be wrapped in a folder)
        $rootDir = $this->detectRootDirectory($zip);
        $identifier = $rootDir ?? basename($zipPath, '.zip');

        // Validate identifier to prevent path traversal
        if (str_contains($identifier, '..') || str_contains($identifier, '/') || str_contains($identifier, '\\')) {
            throw ZipInstallerException::invalidZip();
        }

        $targetPath = $this->extensionsPath.DIRECTORY_SEPARATOR.'modules'.DIRECTORY_SEPARATOR.$identifier;

        // Validate ZIP entries for path traversal before extraction
        $this->validateZipEntries($zip);

        // Extract to temp location first
        $tmpExtract = sys_get_temp_dir().DIRECTORY_SEPARATOR.'ext_install_'.uniqid();
        mkdir($tmpExtract, 0755, true);

        $zip->extractTo($tmpExtract);
        $zip->close();

        // Find actual extracted path
        $sourcePath = $tmpExtract;
        if ($rootDir && is_dir($tmpExtract.DIRECTORY_SEPARATOR.$rootDir)) {
            $sourcePath = $tmpExtract.DIRECTORY_SEPARATOR.$rootDir;
        } elseif (count(scandir($tmpExtract)) === 3) {
            // Single directory inside (., .., dirname)
            $dirs = glob($tmpExtract.DIRECTORY_SEPARATOR.'*', GLOB_ONLYDIR);
            if (count($dirs) === 1) {
                $sourcePath = $dirs[0];
            }
        }

        // Validate manifest before moving
        $manifest = ExtensionManifest::fromFile($sourcePath);

        // Validate manifest identifier to prevent path traversal
        if (str_contains($manifest->identifier, '..') || str_contains($manifest->identifier, '/') || str_contains($manifest->identifier, '\\')) {
            File::deleteDirectory($tmpExtract);
            throw ZipInstallerException::invalidZip();
        }

        $finalPath = $this->extensionsPath.DIRECTORY_SEPARATOR.'modules'.DIRECTORY_SEPARATOR.$manifest->identifier;

        // Remove existing installation if present
        if (is_dir($finalPath)) {
            File::deleteDirectory($finalPath);
        }

        // Move to final location
        File::moveDirectory($sourcePath, $finalPath);

        // Cleanup temp
        if ($cleanup) {
            File::deleteDirectory($tmpExtract);
            @unlink($zipPath);
        }

        return $manifest;
    }

    /**
     * Install from a GitHub owner/repo by downloading the latest release.
     */
    public function installFromGithub(string $owner, string $repo): ExtensionManifest
    {
        $client = app(Marketplace\MarketplaceClient::class);
        $zipPath = $client->downloadRelease($owner, $repo);

        if (! $zipPath) {
            throw ZipInstallerException::downloadFailed($owner, $repo);
        }

        return $this->install($zipPath, cleanup: true);
    }

    /**
     * Validate that no ZIP entry uses path traversal (Zip Slip protection).
     *
     * @throws ZipInstallerException if a malicious entry is detected
     */
    private function validateZipEntries(ZipArchive $zip): void
    {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);

            if (str_contains($name, '..') || str_starts_with($name, '/') || str_starts_with($name, '\\')) {
                throw ZipInstallerException::invalidZip();
            }
        }
    }

    private function detectRootDirectory(ZipArchive $zip): ?string
    {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);

            if (str_ends_with($name, 'extension.json')) {
                $parts = explode('/', $name);

                return $parts[0] !== 'extension.json' ? $parts[0] : null;
            }
        }

        return null;
    }
}
